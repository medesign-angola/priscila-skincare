import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade, CustomerAddress, SaveCustomerAddress } from '@org/core';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, TranslatePipe],
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
  readonly modalOpen = signal(false);
  readonly editingAddress = signal<CustomerAddress | null>(null);
  readonly addressSaving = signal(false);
  readonly addressError = signal(false);

  readonly addressForm = new FormGroup({
    label: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    recipient: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(32)] }),
    country: new FormControl('Angola', { nonNullable: true, validators: [Validators.required] }),
    province: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    neighborhood: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    street: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    houseNumber: new FormControl('', { nonNullable: true }),
    apartment: new FormControl('', { nonNullable: true }),
    postalCode: new FormControl('', { nonNullable: true }),
    isDefault: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const customer = this.auth.customer();
      this.name.setValue(customer?.name ?? '', { emitEvent: false });
      this.phone.setValue(customer?.phone ?? '', { emitEvent: false });
    });
    effect(() => {
      this.document.body.style.overflow = this.modalOpen() ? 'hidden' : '';
    });
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.modalOpen() && !this.addressSaving()) this.closeAddressModal();
  }

  openAddAddress(): void {
    this.editingAddress.set(null);
    this.addressError.set(false);
    this.addressForm.reset({
      label: '', recipient: this.auth.customer()?.name ?? '', phone: this.auth.customer()?.phone ?? '',
      country: 'Angola', province: '', city: '', neighborhood: '', street: '',
      houseNumber: '', apartment: '', postalCode: '',
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
      phone: address.phone,
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

  async saveProfile(): Promise<void> {
    const name = this.name.value.trim();
    if (name) await this.auth.updateProfile(name, this.phone.value.trim());
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/']);
  }

  private closeAddressModalAfterSave(): void {
    this.modalOpen.set(false);
    this.editingAddress.set(null);
  }
}
