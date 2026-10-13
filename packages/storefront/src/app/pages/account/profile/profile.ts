import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { NgxMaskDirective } from 'ngx-mask';
import { AuthFacade, CustomerAddress, internationalPhone, localPhoneValue, PHONE_COUNTRIES, phoneCountry, SaveCustomerAddress } from '@org/core';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, TranslatePipe, NgxMaskDirective],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  readonly name = new FormControl('', { nonNullable: true });
  readonly phone = new FormControl('', { nonNullable: true });
  readonly profilePhoneCountry = signal('Angola');
  readonly countries = PHONE_COUNTRIES;
  readonly modalOpen = signal(false);
  readonly editingAddress = signal<CustomerAddress | null>(null);
  readonly addressSaving = signal(false);
  readonly addressError = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly deleteConfirmation = new FormControl('', { nonNullable: true });
  readonly deletingAccount = signal(false);
  readonly deleteErrorCode = signal<string | null>(null);
  readonly profileSaving = signal(false);
  readonly profileNotice = signal<string | null>(null);
  private profileNoticeTimeout?: ReturnType<typeof setTimeout>;

  readonly addressForm = new FormGroup({
    label: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    recipient: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(32)],
    }),
    country: new FormControl('Angola', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    province: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    neighborhood: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    street: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    houseNumber: new FormControl('', { nonNullable: true }),
    apartment: new FormControl('', { nonNullable: true }),
    postalCode: new FormControl('', { nonNullable: true }),
    isDefault: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const customer = this.auth.customer();
      this.name.setValue(customer?.name ?? '', { emitEvent: false });
      const config=phoneCountry(customer?.phone);
      this.profilePhoneCountry.set(config.country);
      this.phone.setValue(localPhoneValue(customer?.phone,config.country), { emitEvent: false });
    });
    effect((onCleanup) => {
      if (!this.modalOpen() && !this.deleteModalOpen()) return;
      const body = this.document.body;
      const root = this.document.documentElement;
      const view = this.document.defaultView;
      const scrollY = view?.scrollY ?? 0;
      const previous = {
        bodyOverflow: body.style.overflow,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyWidth: body.style.width,
        rootOverflow: root.style.overflow,
        rootOverscroll: root.style.overscrollBehavior,
      };
      root.style.overflow = 'hidden';
      root.style.overscrollBehavior = 'none';
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      onCleanup(() => {
        body.style.overflow = previous.bodyOverflow;
        body.style.position = previous.bodyPosition;
        body.style.top = previous.bodyTop;
        body.style.width = previous.bodyWidth;
        root.style.overflow = previous.rootOverflow;
        root.style.overscrollBehavior = previous.rootOverscroll;
        view?.scrollTo(0, scrollY);
      });
    });
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.modalOpen() && !this.addressSaving()) this.closeAddressModal();
    if (this.deleteModalOpen() && !this.deletingAccount()) this.closeDeleteAccount();
  }

  openAddAddress(): void {
    this.editingAddress.set(null);
    this.addressError.set(false);
    this.addressForm.reset({
      label: '',
      recipient: this.auth.customer()?.name ?? '',
      phone: localPhoneValue(this.auth.customer()?.phone, 'Angola'),
      country: 'Angola',
      province: '',
      city: '',
      neighborhood: '',
      street: '',
      houseNumber: '',
      apartment: '',
      postalCode: '',
      isDefault: (this.auth.customer()?.addresses.length ?? 0) === 0,
    });
    this.modalOpen.set(true);
  }

  openEditAddress(address: CustomerAddress): void {
    this.editingAddress.set(address);
    this.addressError.set(false);
    this.addressForm.reset({
      label: address.label,
      recipient: address.recipient,
      phone: localPhoneValue(address.phone, address.country),
      country: address.country,
      province: address.province,
      city: address.city,
      neighborhood: address.neighborhood,
      street: address.street,
      houseNumber: address.houseNumber ?? '',
      apartment: address.apartment ?? '',
      postalCode: address.postalCode ?? '',
      isDefault: address.isDefault,
    });
    this.modalOpen.set(true);
  }

  closeAddressModal(): void {
    if (this.addressSaving()) return;
    this.modalOpen.set(false);
    this.editingAddress.set(null);
  }

  async saveAddress(): Promise<void> {
    if (this.addressForm.invalid || this.addressSaving()) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.addressSaving.set(true);
    this.addressError.set(false);
    const raw = this.addressForm.getRawValue();
    const payload: SaveCustomerAddress = {
      ...raw,
      phone: internationalPhone(raw.phone, raw.country),
      houseNumber: raw.houseNumber.trim() || undefined,
      apartment: raw.apartment.trim() || undefined,
      postalCode: raw.postalCode.trim() || undefined,
    };
    try {
      const editing = this.editingAddress();
      if (editing) await this.auth.updateAddress(editing.id, payload);
      else await this.auth.createAddress(payload);
      this.closeAddressModalAfterSave();
    } catch {
      this.addressError.set(true);
    } finally {
      this.addressSaving.set(false);
    }
  }

  async makeDefault(address: CustomerAddress): Promise<void> {
    if (!address.isDefault) await this.auth.makeDefaultAddress(address.id);
  }

  async deleteAddress(address: CustomerAddress): Promise<void> {
    await this.auth.deleteAddress(address.id);
  }

  async saveProfile(field: 'name' | 'phone'): Promise<void> {
    if (this.profileSaving()) return;
    const name = this.name.value.trim();
    const phone = internationalPhone(this.phone.value, this.profilePhoneCountry());
    const customer = this.auth.customer();
    if (!name || (name === customer?.name && phone === customer?.phone)) return;
    this.profileSaving.set(true);
    this.profileNotice.set(null);
    try {
      await this.auth.updateProfile(name, phone);
      this.showProfileNotice(
        field === 'name'
          ? 'ACCOUNT.PROFILE.SYNC.NAME_UPDATED'
          : 'ACCOUNT.PROFILE.SYNC.PHONE_UPDATED',
      );
    } finally {
      this.profileSaving.set(false);
    }
  }

  profileMask():string{return phoneCountry(this.profilePhoneCountry()).mask;}
  profilePrefix():string{return `${phoneCountry(this.profilePhoneCountry()).dialCode} `;}
  addressMask():string{return phoneCountry(this.addressForm.controls.country.value).mask;}
  addressPrefix():string{return `${phoneCountry(this.addressForm.controls.country.value).dialCode} `;}

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/']);
  }

  openDeleteAccount(): void {
    this.deleteConfirmation.setValue('');
    this.deleteErrorCode.set(null);
    this.deleteModalOpen.set(true);
  }

  closeDeleteAccount(): void {
    if (!this.deletingAccount()) this.deleteModalOpen.set(false);
  }

  async deleteAccount(): Promise<void> {
    if (this.deletingAccount() || this.deleteConfirmation.value.trim().toLowerCase() !== this.auth.customer()?.email.toLowerCase()) return;
    this.deletingAccount.set(true);
    this.deleteErrorCode.set(null);
    try {
      await this.auth.deleteAccount(this.deleteConfirmation.value);
      await this.router.navigate(['/']);
    } catch (error) {
      const code = error instanceof HttpErrorResponse && typeof error.error?.code === 'string'
        ? error.error.code
        : 'account_deletion_failed';
      this.deleteErrorCode.set(code);
    } finally {
      this.deletingAccount.set(false);
    }
  }

  private closeAddressModalAfterSave(): void {
    this.modalOpen.set(false);
    this.editingAddress.set(null);
  }

  private showProfileNotice(message: string): void {
    if (this.profileNoticeTimeout) clearTimeout(this.profileNoticeTimeout);
    this.profileNotice.set(message);
    this.profileNoticeTimeout = setTimeout(() => this.profileNotice.set(null), 4500);
  }
}
