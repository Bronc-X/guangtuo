'use client';

import Image from 'next/image';
import {useState} from 'react';

import type {Locale} from '@/lib/routing';
import {uiLabArabic} from '@/data/ui-lab-arabic';

import styles from './ui-concept-lab.module.css';

type ConceptId = 'atelier' | 'nocturne' | 'material';
type FinishId = 'satin' | 'gloss' | 'metal';
type IntentId = 'launch' | 'refresh' | 'moq';

type Concept = {
  id: ConceptId;
  index: string;
  name: {zh: string; en: string};
  label: {zh: string; en: string};
  summary: {zh: string; en: string};
  migrated: {zh: string; en: string};
};

const concepts: Concept[] = [
  {
    id: 'atelier',
    index: 'A',
    name: {zh: '品牌顾问桌', en: 'Atelier Desk'},
    label: {zh: '温和、精致、最像真人服务', en: 'Warm, refined and personal'},
    summary: {zh: '对话在左，产品在右；适合首页、产品页和询价前的连续引导。', en: 'Conversation on the left, product on the right, designed for a continuous guided journey.'},
    migrated: {zh: '双层画框 · 联络状态 · 渐变光晕', en: 'Double frame · contact state · gradient glow'}
  },
  {
    id: 'nocturne',
    index: 'B',
    name: {zh: '夜间陈列室', en: 'Nocturne Gallery'},
    label: {zh: '更像高端品牌的数字展厅', en: 'A premium digital showroom'},
    summary: {zh: '模型成为主角，顾问收在右侧；适合强调视觉冲击与品牌感。', en: 'The model takes centre stage while the advisor becomes a focused side rail.'},
    migrated: {zh: '深色 Bento · 分段时间线 · 大图舞台', en: 'Dark bento · step rail · image stage'}
  },
  {
    id: 'material',
    index: 'C',
    name: {zh: '材质样板册', en: 'Material Book'},
    label: {zh: '更像设计师与客户共同选样', en: 'A collaborative sampling table'},
    summary: {zh: '把材质、颜色和沟通放在同一张桌面；适合定制流程与设计工作台。', en: 'Materials, colour and conversation share one tactile working surface.'},
    migrated: {zh: 'Plus Grid · 样板卡 · 编辑式排版', en: 'Plus grid · swatch cards · editorial type'}
  }
];

const intentCopy: Record<IntentId, {label: {zh: string; en: string}; reply: {zh: string; en: string}}> = {
  launch: {
    label: {zh: '准备一款新品', en: 'Planning a new launch'},
    reply: {
      zh: '好的。方便分享产品类型和首批预计数量吗？我会结合需求整理更合适的包装建议。',
      en: 'Of course. What are you filling, and roughly how many units are you considering for the first order?'
    }
  },
  refresh: {
    label: {zh: '更新现有包装', en: 'Refreshing a current pack'},
    reply: {
      zh: '可以。您更想改善外观、使用体验，还是成本结构？也可以把现有包装图片发给我。',
      en: 'Certainly. Are you looking to improve the look, the experience, or the cost structure? You can also share a photo.'
    }
  },
  moq: {
    label: {zh: '了解参考起订量', en: 'Checking minimum order'},
    reply: {
      zh: '不同包装与工艺的起订量会有差异。请告诉我产品类型和目标数量，我会为您核实。',
      en: 'Minimums vary by pack and finish. Tell me the product type and target quantity, and I will help confirm the right route.'
    }
  }
};

const finishes: Array<{id: FinishId; zh: string; en: string}> = [
  {id: 'satin', zh: '缎面', en: 'Satin'},
  {id: 'gloss', zh: '亮面', en: 'Gloss'},
  {id: 'metal', zh: '金属', en: 'Metal'}
];

export function UiConceptLab({locale}: {locale: Locale}) {
  const zh = locale === 'zh';
  const t = (text: string) => locale === 'ar' ? uiLabArabic[text] ?? text : text;
  const displayLocale: 'zh' | 'en' = zh ? 'zh' : 'en';
  const [activeConcept, setActiveConcept] = useState<ConceptId>('atelier');
  const [finish, setFinish] = useState<FinishId>('satin');
  const [intent, setIntent] = useState<IntentId | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const concept = concepts.find((item) => item.id === activeConcept) ?? concepts[0];

  function selectConcept(id: ConceptId) {
    setActiveConcept(id);
    setIntent(null);
    setLeadOpen(false);
  }

  return (
    <main className={styles.page}>
      <style>{'.mail-agent{display:none!important}'}</style>

      <header className={styles.intro}>
        <div>
          <p>{t(zh ? '界面方案预览' : 'INTERFACE CONCEPTS')}</p>
          <h1>{t(zh ? '邮件顾问与 3D 工作台，做成同一套体验。' : 'One experience for advice and 3D.')}</h1>
        </div>
        <span>{t(zh ? '三套都可以直接继续做成正式界面' : 'Each direction can become the production interface')}</span>
      </header>

      <nav className={styles.conceptNav} aria-label={t(zh ? '选择界面方案' : 'Choose an interface direction')}>
        {concepts.map((item) => (
          <button
            className={activeConcept === item.id ? styles.conceptButtonActive : styles.conceptButton}
            type="button"
            key={item.id}
            aria-pressed={activeConcept === item.id}
            onClick={() => selectConcept(item.id)}
          >
            <span>{item.index}</span>
            <div>
              <b>{t(item.name[displayLocale])}</b>
              <small>{t(item.label[displayLocale])}</small>
            </div>
            <i aria-hidden="true">↗</i>
          </button>
        ))}
      </nav>

      <section className={styles.conceptSummary} aria-live="polite">
        <div><span>{concept.index}</span><b>{t(concept.name[displayLocale])}</b></div>
        <p>{t(concept.summary[displayLocale])}</p>
        <small>{t(zh ? '取自 Radiant：' : 'Adapted from Radiant: ')}{t(concept.migrated[displayLocale])}</small>
      </section>

      <section className={`${styles.stage} ${styles[activeConcept]}`} data-finish={finish}>
        <header className={styles.stageHeader}>
          <div className={styles.stageIdentity}>
            <span>GT</span>
            <div><b>SHOWKI</b><small>{t(zh ? '包装设计工作室' : 'PACKAGING STUDIO')}</small></div>
          </div>
          <div className={styles.stageStatus}><span />{t(zh ? '顾问在线' : 'ADVISOR ONLINE')}</div>
          <div className={styles.stageCount}>{concept.index} / 03</div>
        </header>

        <div className={styles.workbench}>
          <aside className={styles.advisor} aria-label={t(zh ? '包装顾问对话预览' : 'Packaging advisor preview')}>
            <header className={styles.advisorHeader}>
              <div className={styles.avatar}>{zh ? '顾' : locale === 'ar' ? 'م' : 'G'}</div>
              <div>
                <small>{t(zh ? '修齐包装顾问' : 'SHOWKI ADVISOR')}</small>
                <b>{t(zh ? '您好，很高兴为您服务。' : 'Hello, how may I help?')}</b>
              </div>
              <span>•••</span>
            </header>

            {!leadOpen ? (
              <>
                <div className={styles.conversation}>
                  <p className={styles.agentBubble}>
                    {t(zh ? '您正在准备一款新品，还是想为现有产品更新包装？' : 'Are you preparing a new launch, or refreshing an existing pack?')}
                  </p>
                  {intent && (
                    <>
                      <p className={styles.userBubble}>{t(intentCopy[intent].label[displayLocale])}</p>
                      <p className={styles.agentBubble}>{t(intentCopy[intent].reply[displayLocale])}</p>
                    </>
                  )}
                </div>

                <div className={styles.promptArea}>
                  <small>{intent ? (t(zh ? '还可以继续问' : 'YOU CAN ALSO ASK')) : (t(zh ? '请选择一项' : 'CHOOSE ONE'))}</small>
                  <div className={styles.promptList}>
                    {(Object.keys(intentCopy) as IntentId[]).map((id) => (
                      <button type="button" key={id} aria-pressed={intent === id} onClick={() => setIntent(id)}>
                        {t(intentCopy[id].label[displayLocale])}<span>→</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button className={styles.proposalButton} type="button" onClick={() => setLeadOpen(true)}>
                  <span>{t(zh ? '请顾问整理初步建议' : 'Ask for an initial direction')}<small>{t(zh ? '样品、报价与交期会由专人继续确认' : 'A person will continue with samples and pricing')}</small></span>
                  <b>↗</b>
                </button>
              </>
            ) : (
              <div className={styles.leadPanel}>
                <button className={styles.backButton} type="button" onClick={() => setLeadOpen(false)}>← {t(zh ? '返回对话' : 'Back')}</button>
                <small>{t(zh ? '查看初步建议前' : 'BEFORE VIEWING YOUR DIRECTION')}</small>
                <h2>{t(zh ? '把刚才聊的，整理成一份初步建议。' : 'Turn the conversation into a clear starting point.')}</h2>
                <p>{t(zh ? '留下工作邮箱即可查看。包装顾问也会继续协助样品、报价和交期。' : 'Leave a work email to view it. Our advisor will continue with samples, pricing and timing.')}</p>
                <label><span>{t(zh ? '您的称呼' : 'Your name')}</span><input placeholder={t(zh ? '怎么称呼您？' : 'How should we address you?')} /></label>
                <label><span>{t(zh ? '工作邮箱' : 'Work email')}</span><input type="email" placeholder="name@company.com" /></label>
                <button className={styles.leadSubmit} type="button">{t(zh ? '查看我的初步建议' : 'View my initial direction')}<span>↗</span></button>
                <em>{t(zh ? '提交后，我们会将刚才的沟通一并带入，无需重复填写。' : 'Your conversation will be carried forward, so you will not need to repeat it.')}</em>
              </div>
            )}
          </aside>

          <section className={styles.studio} aria-label={t(zh ? '3D 包装工作台预览' : '3D packaging workspace preview')}>
            <header className={styles.studioHeader}>
              <div><small>{t(zh ? '当前方案' : 'CURRENT DIRECTION')}</small><h2>{t(zh ? '精华滴管瓶 · 30ml' : 'Serum dropper · 30 ml')}</h2></div>
              <div className={styles.viewSwitch}><button type="button" aria-pressed="true">3D</button><button type="button">{t(zh ? '正视图' : 'FRONT')}</button></div>
            </header>

            <div className={styles.modelStage}>
              <div className={styles.stageNote}><span>01</span><b>{t(zh ? '拖动旋转' : 'DRAG TO ROTATE')}</b></div>
              <div className={`${styles.axis} ${styles.axisX}`}>X</div>
              <div className={`${styles.axis} ${styles.axisY}`}>Y</div>
              <div className={styles.orbit} aria-hidden="true"><span /></div>
              <div className={styles.productImage}>
                <Image src="/assets/products/gt-dropper-030-v2.png" width={1254} height={1254} sizes="(max-width: 800px) 82vw, 48vw" alt={t(zh ? '琥珀色精华滴管瓶预览' : 'Amber serum dropper preview')} priority />
              </div>
              <div className={styles.zoomRail} aria-hidden="true"><span>＋</span><i /><span>−</span></div>
              <div className={styles.modelMeta}><span>GT-DROPPER-030</span><b>{t(zh ? '实时预览' : 'LIVE PREVIEW')}</b></div>
            </div>

            <div className={styles.controlShelf}>
              <div className={styles.finishBlock}>
                <small>{t(zh ? '表面效果' : 'FINISH')}</small>
                <div>
                  {finishes.map((item) => (
                    <button type="button" key={item.id} aria-pressed={finish === item.id} onClick={() => setFinish(item.id)}>
                      <span className={styles.swatch} />{t(zh ? item.zh : item.en)}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.specBlock}>
                <span><small>{t(zh ? '瓶身' : 'BOTTLE')}</small><b>{t(zh ? '透明玻璃' : 'Clear glass')}</b></span>
                <span><small>{t(zh ? '滴管盖' : 'COLLAR')}</small><b>{t(zh ? '墨绿缎面' : 'Forest satin')}</b></span>
                <span><small>{t(zh ? '装饰' : 'DETAIL')}</small><b>{t(zh ? '玫瑰金' : 'Rose gold')}</b></span>
              </div>
              <button className={styles.saveButton} type="button"><span>{t(zh ? '保存当前方案' : 'Save this direction')}</span><b>↗</b></button>
            </div>
          </section>
        </div>

        <footer className={styles.stageFooter}>
          <span>{t(zh ? '在线效果便于比较包装外观，最终颜色与手感以实物样品为准。' : 'The online view confirms the visual direction; colour and feel are approved with samples.')}</span>
          <b>{t(zh ? '界面提案 · 非正式页面' : 'INTERFACE CONCEPT · NOT A LIVE PAGE')}</b>
        </footer>
      </section>
    </main>
  );
}
