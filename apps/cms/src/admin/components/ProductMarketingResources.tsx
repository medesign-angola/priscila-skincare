import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

export type MarketingAsset = {
  id: number;
  name: string;
  url: string;
  alternativeText?: string | null;
};

export type MarketingPendingUpload = {
  id: string;
  name: string;
  previewUrl: string | null;
  progress: number;
};

export type MarketingResourceValues = {
  name: string;
  priceAoa: string;
  editorialEnabled: boolean;
  editorialHeadline: string;
  editorialDescription: string;
  editorialFootnote: string;
  galleryEditorialEnabled: boolean;
  galleryHeadline: string;
  galleryDescription: string;
};

type ResourceKind = 'presentation' | 'gallery';
type Device = 'desktop' | 'mobile';

function MarketingImagePicker({children,onFiles}:{children:ReactNode;onFiles:(files:FileList|null)=>void}){
  const inputRef=useRef<HTMLInputElement>(null);
  const openPicker=()=>{
    if(!inputRef.current)return;
    inputRef.current.value='';
    inputRef.current.click();
  };
  return <Upload><button type="button" onClick={openPicker}>{children}</button><input ref={inputRef} type="file" accept="image/*" tabIndex={-1} aria-hidden="true" onChange={(event)=>onFiles(event.currentTarget.files)}/></Upload>;
}

type Props = {
  values: MarketingResourceValues;
  productImages: MarketingAsset[];
  editorialMedia: MarketingAsset[];
  pendingEditorialMedia: MarketingPendingUpload[];
  uploading: boolean;
  onChange: <K extends keyof MarketingResourceValues>(key: K, value: MarketingResourceValues[K]) => void;
  onEditorialMedia: (files: FileList | null) => void;
  onRemoveEditorialMedia: () => void;
};

const ResourceGrid = styled.div`
  display:grid;gap:16px;
`;
const ResourceCard = styled.article<{ $active:boolean }>`
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:22px;align-items:center;padding:22px;
  border:1px solid ${({$active})=>$active?'#b49667':'#e7e1d8'};border-radius:12px;background:${({$active})=>$active?'#fffdf9':'#fcfbf9'};
  @media(max-width:38rem){grid-template-columns:1fr;}
`;
const ResourceCopy = styled.div`
  display:grid;gap:8px;h3,p{margin:0;}h3{color:#2f303a;font-size:17px;line-height:1.35;}p{max-width:58ch;color:#6d675f;font-size:14px;line-height:1.55;}
`;
const Status = styled.span<{ $tone:'neutral'|'warning'|'ready'|'active' }>`
  justify-self:start;padding:4px 10px;border-radius:999px;color:${({$tone})=>$tone==='active'?'#166534':$tone==='warning'?'#92400e':'#5f5a52'};
  background:${({$tone})=>$tone==='active'?'#dcfce7':$tone==='warning'?'#fef3c7':$tone==='ready'?'#f3ede4':'#eeeae4'};font-size:12px;font-weight:700;
`;
const ConfigureButton = styled.button`
  min-width:150px;min-height:44px;padding:10px 16px;border:1px solid #8b7048;border-radius:9px;color:#7d6645;background:#fff;
  font:inherit;font-size:14px;font-weight:700;cursor:pointer;&:hover{background:#f7f3ed;}&:active{transform:scale(.98);}
`;
const Overlay = styled.div`
  position:fixed;z-index:10000;inset:0;display:grid;place-items:center;padding:24px;background:rgba(26,25,23,.56);
`;
const Dialog = styled.section`
  display:grid;grid-template-rows:auto minmax(0,1fr) auto;width:min(1180px,100%);height:min(820px,calc(100dvh - 48px));overflow:hidden;
  border-radius:14px;background:#fff;box-shadow:0 30px 90px rgba(26,25,23,.28);
`;
const DialogHeader = styled.header`
  display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:22px 26px;border-bottom:1px solid #ece8e1;
  h2,p{margin:0;}h2{color:#2f303a;font-size:22px;}p{margin-top:5px;color:#6d675f;font-size:14px;line-height:1.45;}
`;
const CloseButton = styled.button`
  display:grid;width:40px;height:40px;place-items:center;border:1px solid #ece8e1;border-radius:9px;color:#514b44;background:#fff;font:inherit;font-size:22px;cursor:pointer;
`;
const DialogBody = styled.div`
  display:grid;grid-template-columns:minmax(300px,390px) minmax(0,1fr);min-height:0;@media(max-width:62rem){grid-template-columns:1fr;overflow:auto;}
`;
const FormPane = styled.div`
  display:grid;align-content:start;gap:20px;padding:26px;overflow:auto;border-right:1px solid #ece8e1;@media(max-width:62rem){overflow:visible;border-right:0;border-bottom:1px solid #ece8e1;}
`;
const Field = styled.label`
  display:grid;gap:8px;color:#2f303a;font-size:14px;font-weight:700;small{color:#8f887e;font-size:12px;font-weight:400;line-height:1.45;}
`;
const inputCss = `box-sizing:border-box;width:100%;min-height:48px;padding:11px 12px;border:1px solid rgba(0,0,0,.12);border-radius:10px;color:#1a1917;background:#f7f7f7;font:inherit;font-size:14px;outline:0;&:focus{border-color:#8b7048;box-shadow:0 0 0 3px rgba(139,112,72,.12);}`;
const Input = styled.input`${inputCss}`;
const Textarea = styled.textarea`${inputCss}min-height:106px;resize:vertical;line-height:1.5;`;
const Upload = styled.div`
  button{display:grid;width:100%;min-height:118px;place-items:center;padding:18px;border:1px dashed #b49667;border-radius:10px;color:#7d6645;background:#fffdf9;text-align:center;font:inherit;cursor:pointer;}
  input{display:none;}strong{font-size:14px;}small{margin-top:5px;}button:hover{background:#f8f3eb;}button:focus-visible{outline:3px solid rgba(180,150,103,.3);outline-offset:2px;}
`;
const SelectedMedia = styled.div`
  display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;padding:10px;border:1px solid #ece8e1;border-radius:10px;
  img{width:64px;height:64px;border-radius:8px;object-fit:cover;}strong{overflow:hidden;font-size:13px;text-overflow:ellipsis;white-space:nowrap;}button{border:0;color:#991b1b;background:transparent;font:inherit;font-size:13px;cursor:pointer;}
`;
const PendingMedia = styled.div`
  display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px;border:1px solid #ece8e1;border-radius:10px;background:#fff;
  img{width:64px;height:64px;border-radius:8px;object-fit:cover;}strong{display:block;overflow:hidden;color:#2f303a;font-size:13px;text-overflow:ellipsis;white-space:nowrap;}
  output{color:#1a1917;font-size:13px;font-weight:700;}
`;
const Progress = styled.div`
  display:grid;gap:8px;min-width:0;
`;
const ProgressTrack = styled.div`
  height:9px;overflow:hidden;border-radius:999px;background:#f0ede8;
`;
const ProgressValue = styled.div<{ $progress:number }>`
  width:${({$progress})=>$progress}%;height:100%;border-radius:inherit;background:#8b7048;transition:width .18s ease;
`;
const PreviewPane = styled.div`
  display:grid;grid-template-rows:auto minmax(0,1fr);min-width:0;min-height:0;padding:22px;background:#f3f0eb;
`;
const PreviewToolbar = styled.div`
  display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:14px;color:#514b44;font-size:13px;font-weight:700;
`;
const DeviceSwitch = styled.div`
  display:flex;padding:3px;border-radius:9px;background:#e6e0d8;button{min-height:34px;padding:7px 11px;border:0;border-radius:7px;color:#6d675f;background:transparent;font:inherit;font-size:12px;font-weight:700;cursor:pointer;}button[aria-pressed='true']{color:#1a1917;background:#fff;box-shadow:0 1px 4px rgba(47,48,58,.1);}
`;
const PreviewStage = styled.div<{ $device:Device }>`
  width:${({$device})=>$device==='mobile'?'min(390px,100%)':'100%'};height:100%;min-height:420px;margin:0 auto;overflow:auto;border-radius:8px;background:#fff;box-shadow:0 10px 35px rgba(47,48,58,.12);
`;
const EditorialPreview = styled.div<{ $image?:string }>`
  box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;width:100%;min-height:100%;padding:clamp(24px,5vw,58px);color:#fff;
  background:${({$image})=>$image?`linear-gradient(rgba(0,0,0,.18),rgba(0,0,0,.32)),url("${$image}") center/cover no-repeat`:'#81715d'};
  h3,p{margin:0;}h3{max-width:28rem;font-size:16px;line-height:1.5;text-transform:uppercase;}p{max-width:28rem;margin-top:18px;font-size:14px;line-height:1.55;}footer{display:grid;gap:14px;width:min(100%,330px);margin-top:120px;}button{display:flex;min-height:54px;align-items:center;justify-content:space-between;padding:14px 16px;border:0;border-radius:2px;color:#7d6645;background:#fff;font:inherit;font-size:13px;font-weight:700;text-transform:uppercase;}
`;
const GalleryPreview = styled.div<{ $mobile:boolean }>`
  display:${({$mobile})=>$mobile?'grid':'grid'};grid-template-columns:${({$mobile})=>$mobile?'1fr':'1fr 1.3fr 1fr'};gap:7px;padding:18px;min-height:100%;
  .intro{padding:18px 12px 30px}.intro h3,.intro p{margin:0}.intro h3{font-size:14px;line-height:1.5;text-transform:uppercase}.intro p{margin-top:14px;font-size:13px;line-height:1.5}
  .column{display:grid;gap:7px}.tile{position:relative;min-height:150px;overflow:hidden;background:#ebe8e3}.tile img{width:100%;height:100%;object-fit:cover}.tile span{position:absolute;top:10px;left:10px;color:rgba(255,255,255,.7);font-size:30px;font-weight:800}
  ${({$mobile})=>$mobile&&`.column{display:flex;overflow-x:auto}.tile{flex:0 0 72%;height:280px}.column--end{display:none}`}
`;
const DialogFooter = styled.footer`
  display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 26px;border-top:1px solid #ece8e1;background:#fff;
`;
const FooterHint = styled.p<{ $error?:boolean }>`margin:0;color:${({$error})=>$error?'#991b1b':'#6d675f'};font-size:13px;line-height:1.45;`;
const FooterActions = styled.div`display:flex;gap:10px;`;
const Action = styled.button<{ $primary?:boolean }>`
  min-height:44px;padding:10px 16px;border:1px solid #8b7048;border-radius:9px;color:${({$primary})=>$primary?'#fff':'#7d6645'};background:${({$primary})=>$primary?'#8b7048':'#fff'};font:inherit;font-size:14px;font-weight:700;cursor:pointer;&:disabled{cursor:not-allowed;opacity:.5;}
`;

function resourceStatus(configured:boolean,complete:boolean,enabled:boolean){
  if(enabled&&complete)return {label:'Ativo para marketing',tone:'active' as const};
  if(complete)return {label:'Pronto para ativar',tone:'ready' as const};
  if(configured)return {label:'Configuração incompleta',tone:'warning' as const};
  return {label:'Não configurado',tone:'neutral' as const};
}

export function ProductMarketingResources({values,productImages,editorialMedia,pendingEditorialMedia,uploading,onChange,onEditorialMedia,onRemoveEditorialMedia}:Props){
  const [open,setOpen]=useState<ResourceKind|null>(null);
  const [device,setDevice]=useState<Device>('desktop');
  const [attemptedActivation,setAttemptedActivation]=useState(false);
  const presentationComplete=Boolean(values.editorialHeadline.trim()&&values.editorialDescription.trim()&&editorialMedia[0]);
  const galleryComplete=Boolean(values.galleryHeadline.trim()&&values.galleryDescription.trim()&&productImages.length>=5);
  const presentationConfigured=Boolean(values.editorialHeadline||values.editorialDescription||values.editorialFootnote||editorialMedia.length);
  const galleryConfigured=Boolean(values.galleryHeadline||values.galleryDescription);
  const presentationStatus=resourceStatus(presentationConfigured,presentationComplete,values.editorialEnabled);
  const galleryStatus=resourceStatus(galleryConfigured,galleryComplete,values.galleryEditorialEnabled);
  const activeComplete=open==='presentation'?presentationComplete:galleryComplete;
  const activeEnabled=open==='presentation'?values.editorialEnabled:values.galleryEditorialEnabled;
  const galleryImages=useMemo(()=>productImages.slice(0,5),[productImages]);

  useEffect(()=>{
    if(!open)return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(null);};
    document.addEventListener('keydown',close);
    return()=>document.removeEventListener('keydown',close);
  },[open]);

  const show=(kind:ResourceKind)=>{setAttemptedActivation(false);setDevice('desktop');setOpen(kind);};
  const toggleEnabled=()=>{
    if(!open)return;
    if(!activeEnabled&&!activeComplete){setAttemptedActivation(true);return;}
    if(open==='presentation')onChange('editorialEnabled',!values.editorialEnabled);
    else onChange('galleryEditorialEnabled',!values.galleryEditorialEnabled);
    setAttemptedActivation(false);
  };

  return <>
    <ResourceGrid>
      <ResourceCard $active={values.editorialEnabled&&presentationComplete}>
        <ResourceCopy><Status $tone={presentationStatus.tone}>{presentationStatus.label}</Status><h3>Apresentação editorial com imagem ou vídeo</h3><p>Prepare uma campanha visual deste produto. Depois de pronta, ela poderá ser escolhida na Página Inicial.</p></ResourceCopy>
        <ConfigureButton type="button" onClick={()=>show('presentation')}>{presentationConfigured?'Editar apresentação':'Configurar apresentação'}</ConfigureButton>
      </ResourceCard>
      <ResourceCard $active={values.galleryEditorialEnabled&&galleryComplete}>
        <ResourceCopy><Status $tone={galleryStatus.tone}>{galleryStatus.label}</Status><h3>Galeria editorial</h3><p>Utilize as imagens principais do produto numa composição editorial para campanhas no site.</p></ResourceCopy>
        <ConfigureButton type="button" onClick={()=>show('gallery')}>{galleryConfigured?'Editar galeria':'Configurar galeria'}</ConfigureButton>
      </ResourceCard>
    </ResourceGrid>

    {open&&<Overlay onMouseDown={(event)=>{if(event.target===event.currentTarget)setOpen(null);}}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby="marketing-dialog-title">
        <DialogHeader><div><h2 id="marketing-dialog-title">{open==='presentation'?'Apresentação editorial':'Galeria editorial'}</h2><p>As alterações aparecem imediatamente na pré-visualização.</p></div><CloseButton type="button" aria-label="Fechar" onClick={()=>setOpen(null)}>×</CloseButton></DialogHeader>
        <DialogBody>
          <FormPane>
            {open==='presentation'?<>
              <Field>Título editorial<Input value={values.editorialHeadline} onChange={(event)=>onChange('editorialHeadline',event.target.value)} placeholder="Título principal da campanha"/></Field>
              <Field>Descrição editorial<Textarea value={values.editorialDescription} onChange={(event)=>onChange('editorialDescription',event.target.value)} placeholder="Conte a proposta deste produto"/></Field>
              <Field>Nota complementar<Textarea value={values.editorialFootnote} onChange={(event)=>onChange('editorialFootnote',event.target.value)} placeholder="Texto opcional apresentado abaixo do botão"/></Field>
              <Field>Imagem de apresentação
                {editorialMedia[0]?<SelectedMedia><img src={editorialMedia[0].url} alt=""/><strong>{editorialMedia[0].name}</strong><button type="button" onClick={onRemoveEditorialMedia}>Remover</button></SelectedMedia>:pendingEditorialMedia[0]?<PendingMedia aria-busy="true" role="progressbar" aria-label={`A enviar ${pendingEditorialMedia[0].name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pendingEditorialMedia[0].progress}>{pendingEditorialMedia[0].previewUrl?<img src={pendingEditorialMedia[0].previewUrl} alt=""/>:<span aria-hidden>▧</span>}<Progress><strong>{pendingEditorialMedia[0].name}</strong><ProgressTrack><ProgressValue $progress={pendingEditorialMedia[0].progress}/></ProgressTrack></Progress><output>{pendingEditorialMedia[0].progress}%</output></PendingMedia>:<MarketingImagePicker onFiles={onEditorialMedia}><span><strong>Adicionar imagem editorial</strong><small>Utilize uma imagem horizontal com boa resolução.</small></span></MarketingImagePicker>}
              </Field>
            </>:<>
              <Field>Título da galeria<Input value={values.galleryHeadline} onChange={(event)=>onChange('galleryHeadline',event.target.value)} placeholder="Título principal da galeria"/></Field>
              <Field>Descrição da galeria<Textarea value={values.galleryDescription} onChange={(event)=>onChange('galleryDescription',event.target.value)} placeholder="Texto de apoio à composição editorial"/></Field>
              <FooterHint $error={productImages.length<5}>A galeria utiliza as cinco primeiras imagens principais do produto. {productImages.length<5?`Ainda faltam ${5-productImages.length} imagens.`:'As imagens necessárias já estão disponíveis.'}</FooterHint>
            </>}
          </FormPane>
          <PreviewPane><PreviewToolbar><span>Pré-visualização no site</span><DeviceSwitch><button type="button" aria-pressed={device==='desktop'} onClick={()=>setDevice('desktop')}>Computador</button><button type="button" aria-pressed={device==='mobile'} onClick={()=>setDevice('mobile')}>Telemóvel</button></DeviceSwitch></PreviewToolbar>
            <PreviewStage $device={device}>{open==='presentation'?<EditorialPreview $image={editorialMedia[0]?.url??pendingEditorialMedia[0]?.previewUrl??undefined}><div><h3>{values.editorialHeadline||'Título da apresentação editorial'}</h3><p>{values.editorialDescription||'A descrição editorial aparecerá aqui enquanto preenche o formulário.'}</p></div><footer><button type="button"><span>Adicionar ao carrinho</span><span>{Number(values.priceAoa||0).toLocaleString('pt-AO')} Kz</span></button>{values.editorialFootnote&&<p>{values.editorialFootnote}</p>}</footer></EditorialPreview>:<GalleryPreview $mobile={device==='mobile'}><div className="column"><div className="intro"><h3>{values.galleryHeadline||'Título da galeria editorial'}</h3><p>{values.galleryDescription||'A descrição da galeria aparecerá aqui.'}</p></div>{galleryImages.slice(0,2).map((image,index)=><div className="tile" key={image.id}><img src={image.url} alt=""/><span>0{index+1}</span></div>)}</div>{device==='desktop'&&<div className="tile">{galleryImages[2]&&<img src={galleryImages[2].url} alt=""/>}</div>}<div className="column column--end">{galleryImages.slice(device==='desktop'?3:0).map((image,index)=><div className="tile" key={image.id}><img src={image.url} alt=""/><span>0{device==='desktop'?index+4:index+1}</span></div>)}</div></GalleryPreview>}</PreviewStage>
          </PreviewPane>
        </DialogBody>
        <DialogFooter><FooterHint $error={attemptedActivation&&!activeComplete}>{attemptedActivation&&!activeComplete?(open==='presentation'?'Preencha o título, a descrição e adicione a imagem antes de ativar.':'Preencha o título e a descrição e adicione pelo menos cinco imagens principais antes de ativar.'):'Pode guardar a configuração sem a ativar.'}</FooterHint><FooterActions><Action type="button" onClick={()=>setOpen(null)}>Concluir depois</Action><Action type="button" $primary disabled={uploading} onClick={toggleEnabled}>{activeEnabled?'Desativar recurso':'Ativar recurso'}</Action></FooterActions></DialogFooter>
      </Dialog>
    </Overlay>}
  </>;
}
