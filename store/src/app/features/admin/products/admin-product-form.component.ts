import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UpperCasePipe, CurrencyPipe } from '@angular/common';
import { ProductService } from '../../../core/service/product.service';
import { Products } from '../../../core/models/product.model';
import { NotificationService } from '../../../core/service/notification.service';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [RouterLink, FormsModule, UpperCasePipe, CurrencyPipe],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.css'
})
export class AdminProductFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly notificationService = inject(NotificationService);

  isEditMode = false;
  productId: string | number | null = null;
  isLoading = false;
  submitted = false;

  // Image mode: upload or URL
  imageInputMode: 'upload' | 'url' = 'upload';
  isDragging = false;
  isProcessingImage = false;
  urlInput = '';
  selectedPreviewImage = '';

  readonly categories = ['Running', 'Performance', 'Lifestyle', 'Limited'];
  readonly themes: Array<'lime' | 'blue' | 'peach' | 'dark' | 'purple'> = [
    'lime',
    'blue',
    'peach',
    'dark',
    'purple'
  ];

  formData = {
    name: '',
    brand: '',
    price: null as number | null,
    image: '',
    images: [] as string[],
    description: '',
    category: 'Running',
    tag: '',
    sku: '',
    weight: '',
    colorway: '',
    spec: '',
    theme: 'lime' as 'lime' | 'blue' | 'peach' | 'dark' | 'purple'
  };

  readonly fallbackImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ece6da"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="11" fill="%23888888">NO IMAGE LOADED</text></svg>';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.productId = idParam;
      this.loadExistingProduct(this.productId);
    }
  }

  private loadExistingProduct(id: string | number): void {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (product: Products) => {
        if (product) {
          const gallery = product.images && product.images.length > 0
            ? [...product.images]
            : (product.image ? [product.image] : []);

          this.formData = {
            name: product.name || '',
            brand: product.brand || '',
            price: product.price ?? null,
            image: product.image || gallery[0] || '',
            images: gallery,
            description: product.description || '',
            category: product.category || 'Running',
            tag: product.tag || '',
            sku: product.sku || '',
            weight: product.weight || '',
            colorway: product.colorway || '',
            spec: product.spec || '',
            theme: product.theme || 'lime'
          };

          this.selectedPreviewImage = this.formData.image;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching product for edit:', err);
        this.notificationService.show('Failed to load product details.', 'error');
        this.isLoading = false;
      }
    });
  }

  // =========================================================================
  // VALIDATION HELPERS
  // =========================================================================
  isFieldInvalid(field: string): boolean {
    if (!this.submitted) return false;

    switch (field) {
      case 'name':
        return !this.formData.name || this.formData.name.trim().length < 3;
      case 'brand':
        return !this.formData.brand || this.formData.brand.trim().length < 2;
      case 'sku':
        return !this.formData.sku || this.formData.sku.trim().length < 3;
      case 'category':
        return !this.formData.category || !this.formData.category.trim();
      case 'price':
        return (
          this.formData.price === null ||
          this.formData.price === undefined ||
          isNaN(this.formData.price) ||
          this.formData.price <= 0
        );
      case 'colorway':
        return !this.formData.colorway || !this.formData.colorway.trim();
      case 'description':
        return !this.formData.description || this.formData.description.trim().length < 10;
      case 'image':
        return (
          (!this.formData.image || !this.formData.image.trim()) &&
          (!this.formData.images || this.formData.images.length === 0)
        );
      default:
        return false;
    }
  }

  getFieldError(field: string): string {
    switch (field) {
      case 'name':
        if (!this.formData.name?.trim()) return 'Product name is required';
        if (this.formData.name.trim().length < 3) return 'Name must be at least 3 characters';
        return '';
      case 'brand':
        if (!this.formData.brand?.trim()) return 'Brand is required';
        return '';
      case 'sku':
        if (!this.formData.sku?.trim()) return 'SKU identifier is required';
        if (this.formData.sku.trim().length < 3) return 'SKU must be at least 3 characters';
        return '';
      case 'category':
        if (!this.formData.category?.trim()) return 'Category selection is required';
        return '';
      case 'price':
        if (
          this.formData.price === null ||
          this.formData.price === undefined ||
          isNaN(this.formData.price)
        ) {
          return 'Price is required';
        }
        if (this.formData.price <= 0) return 'Price must be greater than ₹0';
        return '';
      case 'colorway':
        if (!this.formData.colorway?.trim()) return 'Colorway is required (e.g. BLACK / VOLT)';
        return '';
      case 'description':
        if (!this.formData.description?.trim()) return 'Description is required';
        if (this.formData.description.trim().length < 10) {
          return 'Description must be at least 10 characters';
        }
        return '';
      case 'image':
        return 'At least one product photo is required (upload or provide URL)';
      default:
        return '';
    }
  }

  isFormValid(): boolean {
    return (
      !this.isFieldInvalid('name') &&
      !this.isFieldInvalid('brand') &&
      !this.isFieldInvalid('sku') &&
      !this.isFieldInvalid('category') &&
      !this.isFieldInvalid('price') &&
      !this.isFieldInvalid('colorway') &&
      !this.isFieldInvalid('description') &&
      !this.isFieldInvalid('image')
    );
  }

  // =========================================================================
  // MULTIPLE IMAGE UPLOAD & GALLERY MANAGEMENT
  // =========================================================================
  switchImageMode(mode: 'upload' | 'url'): void {
    this.imageInputMode = mode;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      void this.processImageFiles(input.files);
      input.value = ''; // Reset input to allow re-uploading same file name if needed
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      void this.processImageFiles(event.dataTransfer.files);
    }
  }

  async processImageFiles(files: FileList | File[]): Promise<void> {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        this.notificationService.show(`"${file.name}" is not an image file. Skipped.`, 'error');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.show(`"${file.name}" exceeds 5MB limit. Skipped.`, 'error');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    this.isProcessingImage = true;
    let addedCount = 0;

    for (const file of validFiles) {
      try {
        const dataUrl = await this.readAndCompressImage(file);
        if (dataUrl) {
          this.formData.images.push(dataUrl);
          if (!this.formData.image) {
            this.formData.image = dataUrl;
          }
          if (!this.selectedPreviewImage) {
            this.selectedPreviewImage = dataUrl;
          }
          addedCount++;
        }
      } catch (err) {
        console.error('Failed to process image file:', err);
      }
    }

    this.isProcessingImage = false;
    if (addedCount > 0) {
      this.notificationService.show(
        `Added ${addedCount} photo${addedCount > 1 ? 's' : ''} to gallery!`,
        'success'
      );
    }
  }

  private readAndCompressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          resolve('');
          return;
        }

        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const isPng = file.type === 'image/png';
              resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.88));
              return;
            }
          }
          resolve(dataUrl);
        };

        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };

      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }

  setAsCover(img: string): void {
    this.formData.image = img;
    this.selectedPreviewImage = img;
    this.notificationService.show('Primary cover photo updated!', 'info');
  }

  removeImage(index: number): void {
    const removed = this.formData.images.splice(index, 1)[0];
    if (this.formData.image === removed) {
      this.formData.image = this.formData.images[0] || '';
    }
    if (this.selectedPreviewImage === removed) {
      this.selectedPreviewImage = this.formData.image || this.formData.images[0] || '';
    }
  }

  selectPreview(img: string): void {
    this.selectedPreviewImage = img;
  }

  addUrlImage(): void {
    const url = this.urlInput.trim();
    if (!url) {
      this.notificationService.show('Please enter a valid image URL or path.', 'error');
      return;
    }
    if (this.formData.images.includes(url)) {
      this.notificationService.show('This image URL is already in the gallery.', 'info');
      return;
    }

    this.formData.images.push(url);
    if (!this.formData.image) {
      this.formData.image = url;
    }
    this.selectedPreviewImage = url;
    this.urlInput = '';
    this.notificationService.show('Photo added to gallery!', 'success');
  }

  get activePreviewImage(): string {
    return (
      this.selectedPreviewImage ||
      this.formData.image ||
      this.formData.images[0] ||
      this.fallbackImage
    );
  }

  // =========================================================================
  // SUBMIT & CANCEL
  // =========================================================================
  onSubmit(): void {
    if (this.isLoading) return;

    this.submitted = true;

    if (!this.isFormValid()) {
      this.notificationService.show(
        'Please complete all required fields correctly before submitting.',
        'error'
      );

      // Focus first invalid element
      const firstInvalid = document.querySelector(
        '.sr-input--invalid, .sr-textarea--invalid, .sr-select--invalid'
      );
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const primaryImage =
      this.formData.image.trim() ||
      (this.formData.images.length > 0 ? this.formData.images[0] : '');

    const galleryImages =
      this.formData.images.length > 0
        ? [...this.formData.images]
        : (primaryImage ? [primaryImage] : []);

    const payload = {
      name: this.formData.name.trim(),
      brand: this.formData.brand.trim(),
      sku: this.formData.sku.trim(),
      price: Number(this.formData.price),
      category: this.formData.category.trim(),
      colorway: this.formData.colorway.trim(),
      description: this.formData.description.trim(),
      image: primaryImage,
      images: galleryImages,
      tag: this.formData.tag?.trim() || '',
      weight: this.formData.weight?.trim() || '',
      spec: this.formData.spec?.trim() || '',
      theme: this.formData.theme
    };

    this.isLoading = true;

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, payload).subscribe({
        next: (updated) => {
          this.isLoading = false;
          this.notificationService.show(
            `Product "${updated.name || payload.name}" updated successfully!`,
            'success'
          );
          void this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          console.error('Failed to update product:', err);
          this.isLoading = false;
          this.notificationService.show(
            'Failed to update product. Please try again.',
            'error'
          );
        }
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: (created) => {
          this.isLoading = false;
          this.notificationService.show(
            `Product "${created.name || payload.name}" created with ${galleryImages.length} photo(s)!`,
            'success'
          );
          void this.router.navigate(['/admin/products']);
        },
        error: (err) => {
          console.error('Failed to create product:', err);
          this.isLoading = false;
          this.notificationService.show(
            'Failed to create product. Please try again.',
            'error'
          );
        }
      });
    }
  }

  onCancel(): void {
    void this.router.navigate(['/admin/products']);
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.fallbackImage;
    }
  }
}
