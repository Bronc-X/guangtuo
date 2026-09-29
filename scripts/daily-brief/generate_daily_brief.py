#!/usr/bin/env python3
"""Generate the Guangtuo client daily brief PDF from structured JSON data."""

from __future__ import annotations

import argparse
import json
import re
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas


PAGE_W, PAGE_H = A4
MARGIN = 42
CONTENT_W = PAGE_W - MARGIN * 2
TOTAL_PAGES = 3

INK = HexColor("#111318")
MUTED = HexColor("#686A70")
LIGHT_MUTED = HexColor("#A3A4AA")
PAPER = HexColor("#FBFAF7")
WHITE = HexColor("#FFFFFF")
LINE = HexColor("#E2E0DC")
YELLOW = HexColor("#FFF1BE")
PINK = HexColor("#EE87CB")
PURPLE = HexColor("#B060FF")
MAGENTA = HexColor("#B94179")
GREEN = HexColor("#17613C")
GREEN_BG = HexColor("#E6F5EC")
AMBER = HexColor("#7D5516")
AMBER_BG = HexColor("#FFF4CE")
PURPLE_DARK = HexColor("#5A2891")
PURPLE_BG = HexColor("#F1E6FF")
RED = HexColor("#8E2D3A")
RED_BG = HexColor("#FCE8EB")
GRAY_BG = HexColor("#F1F0ED")


def register_fonts() -> None:
    regular_candidates = [
        Path(r"C:\Windows\Fonts\msyh.ttc"),
        Path(r"C:\Windows\Fonts\NotoSansSC-VF.ttf"),
    ]
    bold_candidates = [
        Path(r"C:\Windows\Fonts\msyhbd.ttc"),
        Path(r"C:\Windows\Fonts\NotoSansSC-VF.ttf"),
    ]

    regular = next((path for path in regular_candidates if path.exists()), None)
    bold = next((path for path in bold_candidates if path.exists()), None)
    if not regular or not bold:
        raise FileNotFoundError("A Chinese font was not found in C:\\Windows\\Fonts")

    pdfmetrics.registerFont(TTFont("GT-Regular", str(regular), subfontIndex=0))
    pdfmetrics.registerFont(TTFont("GT-Bold", str(bold), subfontIndex=0))


def tokens_for_wrap(text: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9][A-Za-z0-9+./:_-]*\s*|\s+|.", text, re.DOTALL)


def wrap_text(text: str, font: str, size: float, max_width: float) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        current = ""
        for token in tokens_for_wrap(paragraph):
            candidate = current + token
            if current and pdfmetrics.stringWidth(candidate, font, size) > max_width:
                lines.append(current.rstrip())
                current = token.lstrip()
            else:
                current = candidate
        if current:
            lines.append(current.rstrip())
    return lines


def draw_wrapped(
    canvas: Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    *,
    font: str = "GT-Regular",
    size: float = 9,
    leading: float | None = None,
    color: Color = INK,
    max_lines: int | None = None,
) -> float:
    leading = leading or size * 1.5
    lines = wrap_text(text, font, size, width)
    if max_lines is not None and len(lines) > max_lines:
        lines = lines[:max_lines]
        suffix = "..."
        while lines[-1] and pdfmetrics.stringWidth(lines[-1] + suffix, font, size) > width:
            lines[-1] = lines[-1][:-1]
        lines[-1] += suffix
    canvas.setFillColor(color)
    canvas.setFont(font, size)
    cursor = y
    for line in lines:
        canvas.drawString(x, cursor, line)
        cursor -= leading
    return cursor


def rounded_panel(
    canvas: Canvas,
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    fill: Color = WHITE,
    stroke: Color = LINE,
    radius: float = 12,
    line_width: float = 0.8,
) -> None:
    canvas.setLineWidth(line_width)
    canvas.setStrokeColor(stroke)
    canvas.setFillColor(fill)
    canvas.roundRect(x, y, width, height, radius, stroke=1, fill=1)


def draw_gradient_panel(canvas: Canvas, x: float, y: float, width: float, height: float, radius: float = 18) -> None:
    path = canvas.beginPath()
    path.roundRect(x, y, width, height, radius)
    canvas.saveState()
    canvas.clipPath(path, stroke=0, fill=0)
    canvas.linearGradient(x, y + height, x + width, y, [YELLOW, PINK, PURPLE], [0, 0.56, 1], extend=True)
    canvas.restoreState()
    canvas.setStrokeColor(Color(1, 1, 1, alpha=0.45))
    canvas.setLineWidth(1)
    canvas.roundRect(x, y, width, height, radius, stroke=1, fill=0)


def draw_gradient_bar(canvas: Canvas, x: float, y: float, width: float, height: float) -> None:
    path = canvas.beginPath()
    path.rect(x, y, width, height)
    canvas.saveState()
    canvas.clipPath(path, stroke=0, fill=0)
    canvas.linearGradient(x, y, x + width, y, [YELLOW, PINK, PURPLE], [0, 0.56, 1], extend=True)
    canvas.restoreState()


def status_style(status: str) -> tuple[Color, Color]:
    normalized = status.lower()
    if "verified" in normalized or "已验证" in normalized:
        return GREEN_BG, GREEN
    if "进行中" in normalized or "progress" in normalized:
        return PURPLE_BG, PURPLE_DARK
    if "待客户" in normalized or "input" in normalized:
        return AMBER_BG, AMBER
    if "受阻" in normalized or "blocked" in normalized:
        return RED_BG, RED
    if "已完成" in normalized or "done" in normalized:
        return INK, WHITE
    return GRAY_BG, MUTED


def draw_pill(canvas: Canvas, text: str, x: float, y: float, *, size: float = 7.2) -> float:
    fill, fg = status_style(text)
    padding_x = 7
    height = 18
    width = pdfmetrics.stringWidth(text, "GT-Bold", size) + padding_x * 2
    canvas.setFillColor(fill)
    canvas.roundRect(x, y, width, height, 9, stroke=0, fill=1)
    canvas.setFillColor(fg)
    canvas.setFont("GT-Bold", size)
    canvas.drawString(x + padding_x, y + 5.2, text)
    return width


def resolve_path(repo_root: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else repo_root / path


class ImageCache:
    def __init__(self) -> None:
        self._buffers: list[BytesIO] = []

    def fit(self, path: Path, width: float, height: float, scale: int = 3, contain: bool = False) -> ImageReader:
        if not path.exists():
            raise FileNotFoundError(f"Screenshot not found: {path}")
        with Image.open(path) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            target_size = (max(1, int(width * scale)), max(1, int(height * scale)))
            image = ImageOps.pad(image, target_size, method=Image.Resampling.LANCZOS, color="#FBFAF7") if contain else ImageOps.fit(image, target_size, method=Image.Resampling.LANCZOS)
            buffer = BytesIO()
            image.save(buffer, format="JPEG", quality=93, optimize=True)
        buffer.seek(0)
        self._buffers.append(buffer)
        return ImageReader(buffer)


def draw_image_frame(
    canvas: Canvas,
    cache: ImageCache,
    path: Path,
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    tag: str | None = None,
    contain: bool = False,
) -> None:
    canvas.setFillColor(WHITE)
    canvas.setStrokeColor(LINE)
    canvas.roundRect(x, y, width, height, 9, stroke=1, fill=1)
    inset = 2
    image = cache.fit(path, width - inset * 2, height - inset * 2, contain=contain)
    canvas.drawImage(image, x + inset, y + inset, width - inset * 2, height - inset * 2, mask="auto")
    if tag:
        tag_w = pdfmetrics.stringWidth(tag, "GT-Bold", 6.7) + 14
        canvas.setFillColor(Color(0.066, 0.075, 0.094, alpha=0.88))
        canvas.roundRect(x + 8, y + 8, tag_w, 17, 8.5, stroke=0, fill=1)
        canvas.setFillColor(WHITE)
        canvas.setFont("GT-Bold", 6.7)
        canvas.drawString(x + 15, y + 13.1, tag)


def draw_header(canvas: Canvas, section: str, title: str, meta: dict[str, Any]) -> None:
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_gradient_bar(canvas, 0, PAGE_H - 7, PAGE_W, 7)
    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 8)
    canvas.drawString(MARGIN, PAGE_H - 35, "GUANGTUO  /  广拓生物")
    canvas.setFillColor(MUTED)
    canvas.setFont("GT-Regular", 7.5)
    right = f"{meta['report_id']}  ·  {meta['version']}"
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 35, right)
    canvas.setFillColor(MAGENTA)
    canvas.setFont("GT-Bold", 7.5)
    canvas.drawString(MARGIN, PAGE_H - 72, section)
    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 22)
    canvas.drawString(MARGIN, PAGE_H - 99, title)


def draw_footer(canvas: Canvas, page_no: int, meta: dict[str, Any]) -> None:
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.7)
    canvas.line(MARGIN, 37, PAGE_W - MARGIN, 37)
    canvas.setFillColor(MUTED)
    canvas.setFont("GT-Regular", 6.8)
    canvas.drawString(MARGIN, 23, f"{meta['report_id']}  ·  {meta['date']}  ·  项目沟通资料")
    canvas.drawRightString(PAGE_W - MARGIN, 23, f"{page_no} / {TOTAL_PAGES}")


def metric_card(canvas: Canvas, x: float, y: float, width: float, metric: dict[str, str]) -> None:
    rounded_panel(canvas, x, y, width, 58, fill=WHITE)
    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 20)
    canvas.drawString(x + 12, y + 28, metric["value"])
    canvas.setFillColor(MUTED)
    canvas.setFont("GT-Regular", 7.2)
    canvas.drawString(x + 12, y + 13, metric["label"])


def page_overview(canvas: Canvas, cache: ImageCache, data: dict[str, Any], repo_root: Path) -> None:
    meta = data["meta"]
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_gradient_bar(canvas, 0, PAGE_H - 7, PAGE_W, 7)

    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 8.5)
    canvas.drawString(MARGIN, PAGE_H - 37, "GUANGTUO  /  广拓生物")
    canvas.setFillColor(MUTED)
    canvas.setFont("GT-Regular", 7.5)
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 37, f"{meta['report_id']}  ·  {meta['version']}")

    canvas.setFillColor(MAGENTA)
    canvas.setFont("GT-Bold", 8)
    canvas.drawString(MARGIN, PAGE_H - 82, meta["report_type"])
    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 31)
    canvas.drawString(MARGIN, PAGE_H - 120, meta["project"])
    canvas.setFont("GT-Bold", 25)
    canvas.drawString(MARGIN, PAGE_H - 155, "建设进展简报")

    canvas.setFillColor(MUTED)
    canvas.setFont("GT-Regular", 8)
    canvas.drawString(MARGIN, PAGE_H - 179, f"出具日期  {meta['date']}  ·  内容截止  {meta['effective_through']}  ·  当前阶段  {meta['phase']}")

    draw_gradient_panel(canvas, MARGIN, PAGE_H - 300, CONTENT_W, 96, radius=16)
    draw_pill(canvas, meta["status"], MARGIN + 16, PAGE_H - 230)
    draw_wrapped(
        canvas,
        data["summary"],
        MARGIN + 16,
        PAGE_H - 256,
        CONTENT_W - 32,
        font="GT-Bold",
        size=11.2,
        leading=17,
        max_lines=2,
    )
    canvas.setFillColor(Color(0.066, 0.075, 0.094, alpha=0.68))
    canvas.setFont("GT-Regular", 7.3)
    canvas.drawString(MARGIN + 16, PAGE_H - 286, data["scope_note"])

    metrics = data["metrics"]
    gap = 9
    metric_w = (CONTENT_W - gap * (len(metrics) - 1)) / len(metrics)
    metric_y = PAGE_H - 374
    for index, metric in enumerate(metrics):
        metric_card(canvas, MARGIN + index * (metric_w + gap), metric_y, metric_w, metric)

    screenshot = data["screenshots"][0]
    image_y = 89
    image_h = 303
    draw_image_frame(
        canvas,
        cache,
        resolve_path(repo_root, screenshot["path"]),
        MARGIN,
        image_y,
        CONTENT_W,
        image_h,
        tag=screenshot.get("tag"),
    )
    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 8.2)
    canvas.drawString(MARGIN, 69, f"S01  {screenshot['title']}")
    canvas.setFillColor(MUTED)
    canvas.setFont("GT-Regular", 6.8)
    canvas.drawRightString(PAGE_W - MARGIN, 69, screenshot["route"])
    draw_footer(canvas, 1, meta)
    canvas.showPage()


def evidence_card(
    canvas: Canvas,
    cache: ImageCache,
    item: dict[str, Any],
    repo_root: Path,
    x: float,
    y: float,
    width: float,
    height: float,
) -> None:
    rounded_panel(canvas, x, y, width, height, fill=WHITE)
    image_h = 118
    draw_image_frame(canvas, cache, resolve_path(repo_root, item["path"]), x + 9, y + height - image_h - 9, width - 18, image_h, tag=item.get("tag"), contain=item.get("contain", False))

    text_y = y + height - image_h - 25
    canvas.setFillColor(MAGENTA)
    canvas.setFont("GT-Bold", 7.3)
    canvas.drawString(x + 12, text_y, item["id"])
    pill_w = pdfmetrics.stringWidth(item["status"], "GT-Bold", 6.5) + 14
    draw_pill(canvas, item["status"], x + width - pill_w - 12, text_y - 5, size=6.5)

    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 11.2)
    canvas.drawString(x + 12, text_y - 23, item["title"])
    draw_wrapped(canvas, item["summary"], x + 12, text_y - 43, width - 24, size=7.8, leading=11.6, color=MUTED, max_lines=3)
    canvas.setStrokeColor(LINE)
    canvas.line(x + 12, y + 35, x + width - 12, y + 35)
    canvas.setFillColor(LIGHT_MUTED)
    canvas.setFont("GT-Regular", 6.5)
    canvas.drawString(x + 12, y + 20, item["route"])
    canvas.drawRightString(x + width - 12, y + 20, item.get("viewport", "桌面"))


def page_evidence(canvas: Canvas, cache: ImageCache, data: dict[str, Any], repo_root: Path) -> None:
    meta = data["meta"]
    draw_header(canvas, "01  /  可见更新与截图证据", "客户可以直接看到的变化", meta)
    draw_wrapped(
        canvas,
        data.get("evidence_note", "以下截图均来自本机验证构建。主报告只保留与本轮内容直接相关的页面，避免用工程日志代替客户可见成果。"),
        MARGIN,
        PAGE_H - 121,
        CONTENT_W,
        size=8,
        leading=12,
        color=MUTED,
        max_lines=2,
    )

    items = data["screenshots"][1:5]
    gap_x = 13
    gap_y = 15
    card_w = (CONTENT_W - gap_x) / 2
    card_h = 293
    first_row_y = PAGE_H - 156 - card_h
    second_row_y = first_row_y - gap_y - card_h
    positions = [
        (MARGIN, first_row_y),
        (MARGIN + card_w + gap_x, first_row_y),
        (MARGIN, second_row_y),
        (MARGIN + card_w + gap_x, second_row_y),
    ]
    for item, (x, y) in zip(items, positions):
        evidence_card(canvas, cache, item, repo_root, x, y, card_w, card_h)

    draw_footer(canvas, 2, meta)
    canvas.showPage()


def qa_metric(canvas: Canvas, x: float, y: float, width: float, item: dict[str, str]) -> None:
    rounded_panel(canvas, x, y, width, 66, fill=WHITE)
    canvas.setFillColor(GREEN)
    canvas.setFont("GT-Bold", 7)
    canvas.drawString(x + 11, y + 47, "VERIFIED")
    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 17)
    canvas.drawString(x + 11, y + 24, item["value"])
    canvas.setFillColor(MUTED)
    canvas.setFont("GT-Regular", 6.8)
    canvas.drawString(x + 11, y + 10, item["label"])


def bullet_list(
    canvas: Canvas,
    items: list[str],
    x: float,
    y: float,
    width: float,
    *,
    bullet_color: Color,
    size: float = 8,
    leading: float = 11.5,
    max_lines_each: int = 3,
) -> float:
    cursor = y
    for item in items:
        canvas.setFillColor(bullet_color)
        canvas.circle(x + 3, cursor + 2.2, 2.2, stroke=0, fill=1)
        cursor = draw_wrapped(
            canvas,
            item,
            x + 12,
            cursor + 5,
            width - 12,
            size=size,
            leading=leading,
            color=INK,
            max_lines=max_lines_each,
        )
        cursor -= 5
    return cursor


def page_qa(canvas: Canvas, cache: ImageCache, data: dict[str, Any], repo_root: Path) -> None:
    meta = data["meta"]
    draw_header(canvas, "02  /  验证、边界与下一步", "今天能确认什么，接下来需要什么", meta)

    gap = 9
    qa = data["qa"]
    qa_w = (CONTENT_W - gap * (len(qa) - 1)) / len(qa)
    qa_y = PAGE_H - 184
    for index, item in enumerate(qa):
        qa_metric(canvas, MARGIN + index * (qa_w + gap), qa_y, qa_w, item)

    left_x = MARGIN
    left_w = 322
    right_x = MARGIN + left_w + 14
    right_w = CONTENT_W - left_w - 14

    rounded_panel(canvas, left_x, 382, left_w, 242, fill=WHITE)
    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 13)
    canvas.drawString(left_x + 16, 596, "已知边界与待客户确认")
    draw_pill(canvas, "CLIENT INPUT 待客户确认", left_x + 16, 565, size=6.6)
    bullet_list(canvas, data["client_inputs"], left_x + 16, 540, left_w - 32, bullet_color=AMBER, size=7.8, leading=11.2, max_lines_each=2)

    rtl_item = data["attention"]
    rounded_panel(canvas, right_x, 382, right_w, 242, fill=WHITE)
    canvas.setFillColor(MAGENTA)
    canvas.setFont("GT-Bold", 7.2)
    canvas.drawString(right_x + 12, 596, rtl_item["id"])
    draw_pill(canvas, rtl_item["status"], right_x + 12, 568, size=6.4)
    draw_image_frame(canvas, cache, resolve_path(repo_root, rtl_item["path"]), right_x + 12, 454, right_w - 24, 101, tag=rtl_item.get("tag"))
    canvas.setFillColor(INK)
    canvas.setFont("GT-Bold", 9.5)
    canvas.drawString(right_x + 12, 435, rtl_item["title"])
    draw_wrapped(canvas, rtl_item["summary"], right_x + 12, 418, right_w - 24, size=7.1, leading=9.8, color=MUTED, max_lines=3)

    rounded_panel(canvas, MARGIN, 153, CONTENT_W, 211, fill=INK, stroke=INK)
    canvas.setFillColor(PINK)
    canvas.setFont("GT-Bold", 7.5)
    canvas.drawString(MARGIN + 18, 337, "NEXT  /  下一工作日")
    canvas.setFillColor(WHITE)
    canvas.setFont("GT-Bold", 15)
    canvas.drawString(MARGIN + 18, 313, "按同一标准记录当天增量")

    next_items = data["next_steps"]
    step_w = (CONTENT_W - 36 - 12 * (len(next_items) - 1)) / len(next_items)
    for index, item in enumerate(next_items):
        x = MARGIN + 18 + index * (step_w + 12)
        canvas.setFillColor(Color(1, 1, 1, alpha=0.08))
        canvas.roundRect(x, 194, step_w, 94, 10, stroke=0, fill=1)
        canvas.setFillColor(PINK if index % 2 == 0 else YELLOW)
        canvas.setFont("GT-Bold", 8)
        canvas.drawString(x + 10, 266, f"0{index + 1}")
        canvas.setFillColor(WHITE)
        canvas.setFont("GT-Bold", 8.5)
        canvas.drawString(x + 10, 247, item["title"])
        draw_wrapped(canvas, item["body"], x + 10, 230, step_w - 20, size=6.7, leading=9.2, color=HexColor("#D9D9DB"), max_lines=4)

    canvas.setFillColor(MUTED)
    canvas.setFont("GT-Regular", 6.8)
    canvas.drawString(MARGIN, 132, data["disclaimer"])
    draw_footer(canvas, 3, meta)
    canvas.showPage()


def validate_data(data: dict[str, Any], repo_root: Path) -> None:
    required = ["meta", "summary", "scope_note", "metrics", "screenshots", "attention", "qa", "client_inputs", "next_steps", "disclaimer"]
    missing = [key for key in required if key not in data]
    if missing:
        raise ValueError(f"Missing report fields: {', '.join(missing)}")
    if len(data["metrics"]) != 4 or len(data["qa"]) != 4:
        raise ValueError("The standard layout requires exactly four metrics and four QA results")
    if not 2 <= len(data["screenshots"]) <= 5:
        raise ValueError("The standard layout supports one main screenshot and one to four update screenshots")
    if len(data["next_steps"]) != 4:
        raise ValueError("The standard layout requires exactly four next steps")
    for item in data["screenshots"]:
        screenshot = resolve_path(repo_root, item["path"])
        if not screenshot.exists():
            raise FileNotFoundError(f"Screenshot not found: {screenshot}")
    attention_screenshot = resolve_path(repo_root, data["attention"]["path"])
    if not attention_screenshot.exists():
        raise FileNotFoundError(f"Attention screenshot not found: {attention_screenshot}")


def generate(input_path: Path, output_path: Path) -> None:
    repo_root = Path(__file__).resolve().parents[2]
    with input_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    validate_data(data, repo_root)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    register_fonts()
    cache = ImageCache()
    canvas = Canvas(str(output_path), pagesize=A4, pageCompression=1)
    canvas.setTitle(f"{data['meta']['project']} 建设进展简报 {data['meta']['date']}")
    canvas.setAuthor("Guangtuo website project team")
    canvas.setSubject("Client daily website development brief")
    page_overview(canvas, cache, data, repo_root)
    page_evidence(canvas, cache, data, repo_root)
    page_qa(canvas, cache, data, repo_root)
    canvas.save()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Path to the daily brief JSON data")
    parser.add_argument("--output", required=True, type=Path, help="Path to the generated PDF")
    args = parser.parse_args()
    generate(args.input.resolve(), args.output.resolve())


if __name__ == "__main__":
    main()
