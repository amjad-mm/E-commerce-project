import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe, CurrencyPipe, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/service/auth.service';
import { OrderService } from '../../../core/service/order.service';
import { NotificationService } from '../../../core/service/notification.service';
import { User } from '../../../core/models/user.models';
import { Order } from '../../../core/models/order.model';
import { AuthState } from '../../../core/store/auth.reducer';
import { selectCurrentUser } from '../../../core/store/auth.selectors';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, CurrencyPipe, DatePipe, NgClass, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly store = inject(Store<{ auth: AuthState }>);

  users: User[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Currently logged-in administrator session for safeguarding
  currentLoggedInUser: User | null = null;

  // Filter & Search Controls
  searchText = '';
  selectedRole = 'ALL ROLES';
  selectedStatus = 'ALL STATUSES';
  selectedSort = 'NAME: A TO Z';

  readonly roleOptions = ['ALL ROLES', 'ADMIN', 'CUSTOMER'];
  readonly statusOptions = ['ALL STATUSES', 'ACTIVE', 'BLOCKED'];
  readonly sortOptions = [
    'NAME: A TO Z',
    'NAME: Z TO A',
    'ROLE: ADMIN FIRST',
    'ROLE: CUSTOMER FIRST'
  ];

  // Details Modal State
  isDetailsModalOpen = false;
  selectedUser: User | null = null;
  userOrders: Order[] = [];
  isLoadingUserOrders = false;

  // Add User Modal State
  isAddModalOpen = false;
  isSubmittingNewUser = false;
  addUserSubmitted = false;
  newUser = {
    name: '',
    email: '',
    phone: '',
    role: 'customer' as 'customer' | 'admin',
    password: ''
  };

  // Block / Unblock Modal State
  isBlockModalOpen = false;
  userToBlockAction: User | null = null;

  // Delete User Modal State
  isDeleteModalOpen = false;
  userToDelete: User | null = null;

  ngOnInit(): void {
    this.resolveCurrentLoggedInUser();
    this.loadUsers();
  }

  private resolveCurrentLoggedInUser(): void {
    // 1. From local storage
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('currentUser') : null;
      if (raw) {
        this.currentLoggedInUser = JSON.parse(raw) as User;
      }
    } catch {
      this.currentLoggedInUser = null;
    }

    // 2. From NgRx store if active
    this.store.select(selectCurrentUser).subscribe((storeUser) => {
      if (storeUser) {
        this.currentLoggedInUser = storeUser;
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.hasError = false;

    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load users directory:', err);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Unable to connect to the users service. Ensure backend server is active.';
      }
    });
  }

  // =========================================================================
  // FILTERING & SORTING
  // =========================================================================
  get filteredUsers(): User[] {
    let result = [...this.users];

    // 1. Search Query (Name or Email)
    if (this.searchText.trim()) {
      const query = this.searchText.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.id && String(u.id).toLowerCase().includes(query))
      );
    }

    // 2. Role Filter
    if (this.selectedRole !== 'ALL ROLES') {
      const targetRole = this.selectedRole.toLowerCase();
      result = result.filter((u) => (u.role || 'customer').toLowerCase() === targetRole);
    }

    // 3. Status Filter (Active vs Blocked)
    if (this.selectedStatus === 'ACTIVE') {
      result = result.filter((u) => !u.isBlocked);
    } else if (this.selectedStatus === 'BLOCKED') {
      result = result.filter((u) => Boolean(u.isBlocked));
    }

    // 4. Sorting
    switch (this.selectedSort) {
      case 'NAME: A TO Z':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'NAME: Z TO A':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'ROLE: ADMIN FIRST':
        result.sort((a, b) => {
          const roleA = (a.role || 'customer') === 'admin' ? 0 : 1;
          const roleB = (b.role || 'customer') === 'admin' ? 0 : 1;
          return roleA - roleB;
        });
        break;
      case 'ROLE: CUSTOMER FIRST':
        result.sort((a, b) => {
          const roleA = (a.role || 'customer') === 'customer' ? 0 : 1;
          const roleB = (b.role || 'customer') === 'customer' ? 0 : 1;
          return roleA - roleB;
        });
        break;
    }

    return result;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedRole = 'ALL ROLES';
    this.selectedStatus = 'ALL STATUSES';
    this.selectedSort = 'NAME: A TO Z';
  }

  // Telemetry Counts
  get adminCount(): number {
    return this.users.filter((u) => u.role === 'admin').length;
  }

  get customerCount(): number {
    return this.users.filter((u) => (u.role || 'customer') === 'customer').length;
  }

  get blockedCount(): number {
    return this.users.filter((u) => Boolean(u.isBlocked)).length;
  }

  // Check if a given user is the currently active administrator session
  isCurrentActiveUser(user: User): boolean {
    if (!this.currentLoggedInUser) return false;
    if (user.id && this.currentLoggedInUser.id && String(user.id) === String(this.currentLoggedInUser.id)) {
      return true;
    }
    return (
      Boolean(user.email) &&
      Boolean(this.currentLoggedInUser.email) &&
      user.email.toLowerCase() === this.currentLoggedInUser.email.toLowerCase()
    );
  }

  getUserInitials(name: string): string {
    if (!name) return 'SR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // =========================================================================
  // VIEW USER DETAILS
  // =========================================================================
  openDetailsModal(user: User): void {
    this.selectedUser = user;
    this.isDetailsModalOpen = true;
    this.userOrders = [];
    this.isLoadingUserOrders = true;

    if (user.email) {
      this.orderService.getOrdersByUser(user.email).subscribe({
        next: (orders) => {
          this.userOrders = orders || [];
          this.isLoadingUserOrders = false;
        },
        error: () => {
          this.userOrders = [];
          this.isLoadingUserOrders = false;
        }
      });
    } else {
      this.isLoadingUserOrders = false;
    }
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.selectedUser = null;
    this.userOrders = [];
  }

  getUserLifetimeSpend(): number {
    return this.userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  }

  // =========================================================================
  // CREATE USER MODAL
  // =========================================================================
  openAddModal(): void {
    this.newUser = {
      name: '',
      email: '',
      phone: '',
      role: 'customer',
      password: ''
    };
    this.addUserSubmitted = false;
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.addUserSubmitted = false;
  }

  submitAddUser(): void {
    this.addUserSubmitted = true;

    if (
      !this.newUser.name.trim() ||
      !this.newUser.email.trim() ||
      !this.isValidEmail(this.newUser.email) ||
      !this.newUser.password ||
      this.newUser.password.length < 6
    ) {
      this.notificationService.show('Please complete all required fields correctly.', 'error');
      return;
    }

    // Check email uniqueness locally first
    const existing = this.users.find(
      (u) => u.email.toLowerCase() === this.newUser.email.trim().toLowerCase()
    );
    if (existing) {
      this.notificationService.show('A user account with this email already exists.', 'error');
      return;
    }

    this.isSubmittingNewUser = true;

    const payload: User = {
      name: this.newUser.name.trim(),
      email: this.newUser.email.trim().toLowerCase(),
      phone: this.newUser.phone.trim() || undefined,
      role: this.newUser.role,
      password: this.newUser.password,
      isBlocked: false
    };

    this.authService.createUser(payload).subscribe({
      next: (created) => {
        this.isSubmittingNewUser = false;
        this.closeAddModal();
        this.notificationService.show(
          `User account "${created.name}" created successfully as ${created.role?.toUpperCase()}!`,
          'success'
        );
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to create user:', err);
        this.isSubmittingNewUser = false;
        this.notificationService.show('Failed to create user account. Please try again.', 'error');
      }
    });
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // =========================================================================
  // BLOCK / UNBLOCK USER ACTION (SAFEGUARDED)
  // =========================================================================
  openBlockModal(user: User): void {
    if (this.isCurrentActiveUser(user)) {
      this.notificationService.show(
        'Action blocked: You cannot suspend your own active administrator account.',
        'error'
      );
      return;
    }

    this.userToBlockAction = user;
    this.isBlockModalOpen = true;
  }

  closeBlockModal(): void {
    this.isBlockModalOpen = false;
    this.userToBlockAction = null;
  }

  confirmBlockToggle(): void {
    const targetUser = this.userToBlockAction;
    if (!targetUser || targetUser.id === undefined) return;

    const newBlockedState = !targetUser.isBlocked;
    const userId = targetUser.id;

    this.authService.updateUser(userId, { isBlocked: newBlockedState }).subscribe({
      next: () => {
        targetUser.isBlocked = newBlockedState;

        // If target user is stored locally on this machine, clear their session immediately
        if (newBlockedState && typeof localStorage !== 'undefined') {
          try {
            const raw = localStorage.getItem('currentUser');
            if (raw) {
              const u = JSON.parse(raw);
              if (u.email && targetUser.email && u.email.toLowerCase() === targetUser.email.toLowerCase()) {
                localStorage.removeItem('currentUser');
              }
            }
          } catch {}
        }

        this.closeBlockModal();
        const msg = newBlockedState
          ? `Account for "${targetUser.name}" (${targetUser.email}) has been BANNED / BLOCKED. Access revoked.`
          : `Access restored: Account for "${targetUser.name}" (${targetUser.email}) is now ACTIVE.`;
        this.notificationService.show(msg, newBlockedState ? 'error' : 'success');
      },
      error: (err) => {
        console.error('Failed to update account status:', err);
        this.notificationService.show('Failed to update account status.', 'error');
      }
    });
  }

  // =========================================================================
  // DELETE USER (SAFEGUARDED)
  // =========================================================================
  openDeleteModal(user: User): void {
    if (this.isCurrentActiveUser(user)) {
      this.notificationService.show(
        'Action blocked: Cannot terminate the currently active administrator session.',
        'error'
      );
      return;
    }

    this.userToDelete = user;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    const targetUser = this.userToDelete;
    if (!targetUser || targetUser.id === undefined) return;

    const userId = targetUser.id;

    this.authService.deleteUser(userId).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.notificationService.show(
          `User account "${targetUser.name}" deleted from database.`,
          'info'
        );
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to delete user:', err);
        this.notificationService.show('Failed to delete user account.', 'error');
      }
    });
  }
}
