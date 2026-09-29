import type {ZodIssue} from 'zod';
import type {Locale} from './routing';

const validationCopy = {
  en: {required: 'Please enter {field}.', email: 'Please enter a valid work email address.', consent: 'Please agree to the use of your information before continuing.', long: '{field}: use no more than {limit} characters.', invalid: 'Please check {field}.', fallback: 'Please check the enquiry details.'},
  zh: {required: '请填写{field}。', email: '请填写有效的工作邮箱。', consent: '请先同意个人信息使用说明，再继续提交。', long: '{field}请不要超过 {limit} 个字符。', invalid: '请检查{field}。', fallback: '请检查产品需求信息。'},
  fr: {required: 'Veuillez renseigner le champ « {field} ».', email: 'Veuillez saisir une adresse e-mail professionnelle valide.', consent: 'Veuillez accepter l’utilisation de vos informations avant de continuer.', long: '{field} : limitez le texte à {limit} caractères.', invalid: 'Veuillez vérifier le champ « {field} ».', fallback: 'Veuillez vérifier les informations de la demande.'},
  es: {required: 'Completa el campo «{field}».', email: 'Introduce un correo de trabajo válido.', consent: 'Acepta el uso de tus datos antes de continuar.', long: '{field}: utiliza un máximo de {limit} caracteres.', invalid: 'Revisa el campo «{field}».', fallback: 'Revisa los datos de la consulta.'},
  ru: {required: 'Заполните поле «{field}».', email: 'Укажите действительный рабочий адрес электронной почты.', consent: 'Подтвердите согласие на использование данных, прежде чем продолжить.', long: '{field}: не более {limit} символов.', invalid: 'Проверьте поле «{field}».', fallback: 'Проверьте сведения о запросе.'},
  ar: {required: 'يرجى إدخال {field}.', email: 'يرجى إدخال عنوان بريد عمل صالح.', consent: 'يرجى الموافقة على استخدام معلوماتك قبل المتابعة.', long: '{field}: يرجى ألا يتجاوز النص {limit} حرفاً.', invalid: 'يرجى التحقق من {field}.', fallback: 'يرجى التحقق من تفاصيل الاستفسار.'}
} satisfies Record<Locale, Record<string, string>>;

export function inquiryValidationMessage(issue: ZodIssue, locale: Locale, labels: Record<string, string>): string {
  const copy = validationCopy[locale];
  const field = String(issue.path[0] ?? '');
  if (field === 'privacyConsent') return copy.consent;
  if (field === 'businessEmail' && issue.code !== 'too_big') return copy.email;
  const label = labels[field];
  if (!label) return copy.fallback;
  const template = issue.code === 'too_small' ? copy.required : issue.code === 'too_big' ? copy.long : copy.invalid;
  return template.replace('{field}', label).replace('{limit}', issue.code === 'too_big' ? String(issue.maximum) : '');
}
