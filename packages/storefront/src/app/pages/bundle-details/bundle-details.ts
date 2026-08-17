import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CartFacade, HeaderService, Product, ProductFacade } from '@org/core';
import { formatPrice, PriceFormatPipe, ProductCard, ProductCardData } from '@org/shared';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductUsageSection } from '../product-details/sections/product-usage-section/product-usage-section';
import { ProductResultsSection } from '../product-details/sections/product-results-section/product-results-section';
import { RelatedProductsSection } from '../product-details/sections/related-products-section/related-products-section';
import { ShippingInformationSection } from '../product-details/sections/shipping-information-section/shipping-information-section';
import { ProductGallery } from '../../components/product-gallery';

@Component({ selector: 'app-bundle-details', imports: [TranslatePipe, PriceFormatPipe, ProductCard, ProductUsageSection, ProductResultsSection, RelatedProductsSection, ShippingInformationSection, ProductGallery], templateUrl: './bundle-details.html', styleUrl: './bundle-details.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class BundleDetails {
  readonly facade = inject(ProductFacade); readonly header = inject(HeaderService); private readonly cart = inject(CartFacade); private readonly router = inject(Router); private readonly route = inject(ActivatedRoute); private readonly destroyRef = inject(DestroyRef);
  private readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('bundleId'))), { initialValue: null });
  readonly type = this.route.snapshot.data['bundleType'] as 'kit' | 'collection';
  constructor(){const previous=this.header.theme();this.header.theme.set('black');this.destroyRef.onDestroy(()=>this.header.theme.set(previous));}
  readonly bundle = computed(() => { const id=this.id(); const list=this.type==='kit'?this.facade.kitsWithProducts():this.facade.collectionsWithProducts(); return list.find((item)=>item.id===id||item.slug===id)??null; });
  readonly content = computed(() => this.bundle()?.translations[this.facade.currentLanguage()]);
  readonly images = computed(() => {const details=this.bundle()?.details?.[this.facade.currentLanguage()];return details?.images.length?details.images:[this.bundle()?.thumbnailImage??''];});
  readonly price = computed(() => (this.bundle() as any)?.prices?.[this.header.currency()] ?? (this.bundle() as any)?.price ?? 0);
  readonly sectionProduct = computed<Product|null>(()=>{const bundle=this.bundle();if(!bundle)return null;return {id:bundle.id,sku:`${this.type}:${bundle.id}`,slug:bundle.slug,featured:false,categoryId:'',sizeIds:[],images:this.images(),thumbnailImage:bundle.thumbnailImage??'',translations:{pt:this.synthetic(bundle.translations.pt.name,bundle.translations.pt.description,bundle.details?.pt),fr:this.synthetic(bundle.translations.fr.name,bundle.translations.fr.description,bundle.details?.fr)}};});
  readonly includedCards=computed(()=>this.cards(this.bundle()?.products??[]));
  readonly relatedProducts=computed(()=>{const ids=new Set(this.bundle()?.relatedProductIds??[]);return this.facade.products().filter((product)=>ids.has(product.id));});
  readonly rating=computed(()=>{const products=this.bundle()?.products??[];if(!products.length)return {average:0,total:0};const language=this.facade.currentLanguage();const total=products.reduce((sum,product)=>sum+product.translations[language].reviews.totalReviews,0);const weighted=products.reduce((sum,product)=>sum+(product.translations[language].reviews.averageRating*product.translations[language].reviews.totalReviews),0);return {average:total?weighted/total:0,total};});
  openProduct(id:string){void this.router.navigate(['/produtos',id]);} addProduct(id:string){this.cart.add(id);}
  addBundle(){const bundle=this.bundle();const content=this.content();if(!bundle||!content)return;this.cart.addBundle({id:bundle.id,type:this.type,name:content.name,image:bundle.thumbnailImage??'',productCount:bundle.products.length,prices:{AOA:(bundle as any).prices?.AOA??(bundle as any).price??0,EUR:(bundle as any).prices?.EUR??0}});}
  private synthetic(name:string,description:string,details:any){return {name,description,highlights:[],benefits:{mainImage:details?.howToUse.editorialImage??'',sections:[]},ingredients:{name:'',description:'',mainIngredientsImages:[],bodyResultImage:''},howToUse:details?.howToUse??{steps:[]},result:details?.result??{data:[],description:'',images:{before:'',after:''}},reviews:{averageRating:0,totalReviews:0,userReviews:[]}};}
  private cards(products:Product[]):ProductCardData[]{const language=this.facade.currentLanguage();return products.flatMap((product)=>product.commerce?[{id:product.id,name:product.translations[language].name,description:product.translations[language].description,categoryLabel:this.facade.mappedCategories().get(product.categoryId)?.translations?.[language]??'',imageUrl:product.images[0]??product.thumbnailImage,rating:product.translations[language].reviews.averageRating,totalReviews:product.translations[language].reviews.totalReviews,currencyLabel:this.header.currency()==='AOA'?'Kz':'€',priceLabel:formatPrice(product.commerce.prices[this.header.currency()],this.header.currency(),language,false),available:product.commerce.availability==='in-stock',addedToCart:this.cart.items().some((item)=>item.productId===product.id),badge:product.commerce.badge}]:[]);}
}
