'use client';

import {useRouter} from 'next/navigation';
import {useState, type FormEvent} from 'react';
import {categories, products} from '@/data/catalog';
import type {InquiryInput} from '@/lib/contracts';
import {localizedPath, type Locale} from '@/lib/routing';

const formCopy: Record<Locale, Record<string, string>> = {
  en: {
    name: 'Name', email: 'Work email', company: 'Company / brand', market: 'Target sales market', choose: 'Choose a finished product', choosePlaceholder: 'Select a product', family: 'Product family', quantity: 'Expected quantity',
    goal: 'Product goal and intended skincare use', preference: 'Formula, format and packaging preferences', launch: 'Preferred launch date', requirements: 'Market-specific requirements', optional: 'Optional — add any label, document or testing needs you already know',
    marketExample: 'e.g. EU, Southeast Asia', quantityExample: 'e.g. 10,000 units', goalExample: 'e.g. cooling eye-area care for a retail launch', preferenceExample: 'e.g. hydrogel shape, net weight and jar or sachet requirements', launchExample: 'e.g. Q1 2027',
    budget: 'Not decided yet', consent: 'I agree that Guangtuo may use these details to contact me about this finished-product project.', working: 'Preparing your summary…', submit: 'Continue with this product'
  },
  zh: {
    name: '姓名', email: '工作邮箱', company: '公司或品牌名称', market: '目标销售市场', choose: '选择感兴趣的成品', choosePlaceholder: '请选择产品', family: '产品系列', quantity: '预计采购数量',
    goal: '产品目标与预期护肤用途', preference: '配方、形态与包装偏好', launch: '希望上市时间', requirements: '目标市场的特殊要求', optional: '选填：已知的标签、资料或检测需求',
    marketExample: '例如：欧盟、东南亚', quantityExample: '例如：10,000 件', goalExample: '例如：用于零售新品的冷感眼周护理', preferenceExample: '例如：凝胶形状、净含量与罐装或袋装要求', launchExample: '例如：2027 年第一季度',
    budget: '暂未确定', consent: '我同意广拓使用以上信息就本次成品项目与我联系。', working: '正在准备摘要…', submit: '按此产品继续'
  },
  fr: {
    name: 'Nom', email: 'E-mail professionnel', company: 'Entreprise / marque', market: 'Marché cible', choose: 'Choisir un produit fini', choosePlaceholder: 'Sélectionnez un produit', family: 'Famille de produits', quantity: 'Quantité prévue',
    goal: 'Objectif du produit et usage cosmétique prévu', preference: 'Préférences de formule, de format et d’emballage', launch: 'Date de lancement souhaitée', requirements: 'Exigences propres au marché', optional: 'Facultatif — ajoutez les besoins connus en matière d’étiquette, document ou essai',
    marketExample: 'ex. Union européenne, Asie du Sud-Est', quantityExample: 'ex. 10 000 unités', goalExample: 'ex. soin frais du contour des yeux pour un lancement retail', preferenceExample: 'ex. forme hydrogel, poids net et pot ou sachet', launchExample: 'ex. T1 2027',
    budget: 'Pas encore décidé', consent: 'J’accepte que Guangtuo utilise ces informations pour me contacter au sujet de ce projet de produit fini.', working: 'Préparation du résumé…', submit: 'Continuer avec ce produit'
  },
  es: {
    name: 'Nombre', email: 'Correo de trabajo', company: 'Empresa / marca', market: 'Mercado objetivo', choose: 'Elegir un producto terminado', choosePlaceholder: 'Seleccione un producto', family: 'Familia de productos', quantity: 'Cantidad prevista',
    goal: 'Objetivo del producto y uso cosmético previsto', preference: 'Preferencias de fórmula, formato y empaque', launch: 'Fecha de lanzamiento prevista', requirements: 'Requisitos específicos del mercado', optional: 'Opcional — añada requisitos conocidos de etiqueta, documentos o pruebas',
    marketExample: 'p. ej., UE, Sudeste Asiático', quantityExample: 'p. ej., 10.000 unidades', goalExample: 'p. ej., cuidado refrescante del contorno de ojos para retail', preferenceExample: 'p. ej., forma de hidrogel, peso neto y frasco o sobre', launchExample: 'p. ej., T1 2027',
    budget: 'Aún no decidido', consent: 'Acepto que Guangtuo use estos datos para contactarme sobre este proyecto de producto terminado.', working: 'Preparando el resumen…', submit: 'Continuar con este producto'
  }
};

export function RecommendationForm({locale}: {locale: Locale}) {
  const copy = formCopy[locale];
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [selectedSku, setSelectedSku] = useState('');
  const selectedProduct = products.find((product) => product.sku === selectedSku); const selectedCategory = categories.find((category) => category.slug === selectedProduct?.category);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) return;
    setWorking(true);
    const data = new FormData(event.currentTarget);
    const inquiry: InquiryInput = {
      name: String(data.get('name')),
      businessEmail: String(data.get('businessEmail')),
      company: String(data.get('company')),
      market: String(data.get('market')),
      category: selectedProduct.category,
      sku: selectedProduct.sku,
      configuration: '',
      quantity: String(data.get('quantity')),
      budget: copy.budget,
      launchDate: String(data.get('launchDate')),
      productGoal: String(data.get('productGoal')),
      packagingPreference: String(data.get('packagingPreference')),
      certificationConstraints: String(data.get('certificationConstraints') ?? ''),
      notes: '',
      privacyConsent: true
    };
    sessionStorage.removeItem('gt-mail-agent-lead');
    sessionStorage.setItem('gt-recommendation', JSON.stringify(inquiry));
    router.push(localizedPath(locale, 'proposal'));
  }

  return (
    <form className="brief-form brief-form--recommend" onSubmit={submit}>
      <div className="form-grid">
        <label><span>{copy.name}</span><input name="name" required maxLength={200} autoComplete="name" /></label>
        <label><span>{copy.email}</span><input name="businessEmail" type="email" required maxLength={254} autoComplete="email" /></label>
        <label><span>{copy.company}</span><input name="company" required maxLength={200} autoComplete="organization" /></label>
        <label><span>{copy.market}</span><input name="market" required maxLength={200} placeholder={copy.marketExample} /></label>
        <label><span>{copy.choose}</span><select name="sku" required value={selectedSku} onChange={(event) => setSelectedSku(event.target.value)}><option value="" disabled>{copy.choosePlaceholder}</option>{products.map((product) => <option value={product.sku} key={product.sku}>{product.name[locale]} · {product.sku}</option>)}</select></label>
        <label><span>{copy.family}</span><input value={selectedCategory?.name[locale] ?? ''} readOnly aria-readonly="true" /></label>
        <label><span>{copy.quantity}</span><input name="quantity" required maxLength={200} placeholder={copy.quantityExample} /></label>
        <label><span>{copy.launch}</span><input name="launchDate" required maxLength={200} placeholder={copy.launchExample} /></label>
        <label className="form-span-2"><span>{copy.goal}</span><textarea name="productGoal" required maxLength={500} rows={3} placeholder={copy.goalExample} /></label>
        <label className="form-span-2"><span>{copy.preference}</span><textarea name="packagingPreference" required maxLength={500} rows={2} placeholder={copy.preferenceExample} /></label>
        <label className="form-span-2"><span>{copy.requirements}</span><textarea name="certificationConstraints" maxLength={500} rows={2} placeholder={copy.optional} /></label>
      </div>
      <label className="consent"><input type="checkbox" required /> <span>{copy.consent}</span></label>
      <button className="button button--primary" disabled={working || !selectedProduct} type="submit">{working ? copy.working : copy.submit}</button>
    </form>
  );
}
