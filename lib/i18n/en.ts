// English translations for CasaPilot
const enTranslations = {
  // Navigation
  nav: {
    dashboard: 'Home',
    inventory: 'Inventory',
    purchases: 'Purchases',
    maintenance: 'Maintenance',
    expenses: 'Movements',
    vendors: 'Vendors',
    reports: 'Reports',
    billing: 'Billing',
    rentals: 'Calendar',
    account: 'Account',
    operation: 'Operation',
    finances: 'Finances',
    bank: 'Bank',
    settings: 'Settings',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Summary of {propertyName}',
    todaySummary: 'Today\'s Summary',
    subtitleContext: '{propertyName} • {month} {year}',
    overview: 'CasaPilot Management Overview',
    quickActions: 'Quick Actions',
    newBooking: 'New Booking',
    newTask: 'New Task',
    addExpense: 'Record Expense',
    newTicket: 'New Ticket',
    addItem: 'Add Item',
    inventory: 'Inventory',
    maintenance: 'Maintenance',
    thisMonth: 'This month',
    current: 'Current',
    expenses: 'Expenses',
    income: 'Income',
    balance: 'Balance',
    occupancy: 'Occupancy',
    netProfit: 'Net Profit',
    upcomingBookings: 'Upcoming Bookings',
    upcomingBookingsSubtitle: 'Next 7 Days',
    viewAll: 'View all',
    urgentTickets: '{count} urgent tickets',
    lowStockAlert: '{count} items with low stock',
    purchases: 'Purchases',
    moreItems: '{count} more items',
    moreUrgentTickets: '{count} more urgent tickets',
    left: 'remaining',
    noUpcomingBookings: 'No upcoming bookings',
    guest: 'Guest',
    nights: '{count} {count, plural, one {night} other {nights}}',
    staffAccount: 'Staff Account',
    staffAccountMessage: 'You are connected as a staff member. To upgrade to admin, go to Supabase → Table Editor → profiles → change your role to \'admin\'.',
    accountConfigError: 'Account Configuration Error',
    accountConfigMessage: 'Your account ({email}) does not have tenant information.',
    accountConfigDetails: 'This usually happens when your account was created before the tenant system was configured. Please contact support or run this SQL in Supabase:',
    noPropertyTitle: 'No property selected',
    noPropertyDescription: 'Select or create a property to get started.',
    createProperty: 'Create Property',
    today: 'Today',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    total: 'Total',
    dueToday: 'Due today',
    scheduledToday: 'Scheduled for today',
    attention: 'Attention',
    overdueTasks: '{count} overdue tasks',
  },

  // Reports
  reports: {
    title: 'Reports & Analytics',
    subtitle: 'Financial insights and operational metrics',
    selectMonth: 'Select Month',
    exportCSV: 'Export CSV',
    monthlyExpenseSummary: 'Monthly Expense Summary',
    totalExpenses: 'Total Expenses',
    maintenance: 'Maintenance',
    other: 'Other',
    byCategory: 'By Category',
    byVendor: 'By Vendor',
    category: 'Category',
    vendor: 'Vendor',
    amount: 'Amount',
    maintenanceCostSummary: 'Maintenance Cost Summary',
    last6Months: 'Last 6 Months',
    byRoom: 'By Room/Area',
    inventoryInsights: 'Inventory Insights',
    lowStockItems: 'Low Stock Items',
    byLocation: 'By Location',
    items: 'items',
    loadError: 'Error loading reports',
    noExpensesThisMonth: 'No expenses this month',
    noExpensesDescription: 'Add expenses to see analysis',
    noMaintenanceCosts: 'No maintenance costs recorded',
    noMaintenanceCostsDescription: 'Add costs to maintenance tickets to see analysis',
    noInventoryData: 'No inventory data',
    noInventoryDataDescription: 'Add inventory items to see insights',
    noVendorExpenses: 'No vendor expenses recorded',
    reportExported: 'Report exported successfully',
    monthlyExpenseReport: '{propertyName} - Monthly Expense Report',
    month: 'Month',
    summary: 'Summary',
  },

  // Rentals
  rentals: {
    title: 'Bookings',
    subtitle: 'Manage bookings, income and occupancy',
    newBooking: 'New Booking',
    addBooking: 'Add Booking',
    editBooking: 'Edit Booking',
    monthlyStats: 'Monthly Statistics',
    income: 'Income',
    expenses: 'Expenses',
    profit: 'Profit',
    bookings: 'Bookings',
    occupancyRate: 'Occupancy Rate',
    calendar: 'Calendar',
    list: 'List',
    guestName: 'Guest Name',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    nights: 'Nights',
    platform: 'Platform',
    total: 'Total',
    cleaningFee: 'Cleaning Fee',
    notes: 'Notes',
    status: 'Status',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pending: 'Pending',
    noBookings: 'No bookings',
    noBookingsDescription: 'Add a booking to get started',
    noPropertySelected: 'No Property Selected',
    noPropertyDescription: 'Please select or create a property to manage bookings.',
    loadError: 'Error loading data',
    bookingOverlap: 'Booking dates overlap with an existing booking for this property',
    checkInRequired: 'Check-in date is required',
    checkOutRequired: 'Check-out date is required',
    checkOutAfterCheckIn: 'Check-out date must be after check-in date',
    guestNameRequired: 'Guest name is required',
    amountNotNegative: 'Total amount cannot be negative',
    noActiveProperty: 'No active property selected',
    bookingUpdated: 'Booking updated successfully',
    bookingCreated: 'Booking created successfully',
    bookingDeleted: 'Booking deleted successfully',
    saveError: 'Error saving booking',
    deleteError: 'Error deleting booking',
    booked: 'Booked',
    available: 'Available',
    today: 'Today',
    hoverForDetails: 'Hover to see details',
    hoverForGuestTotal: 'Hover to see guest and total',
    guest: 'Guest',
    checkInDate: 'Check-in',
    checkOutDate: 'Check-out',
    statusConfirmed: 'Confirmed',
    statusCancelled: 'Cancelled',
    statusCompleted: 'Completed',
  },

  // Common
  common: {
    date: 'Date',
    category: 'Category',
    status: 'Status',
    priority: 'Priority',
    amount: 'Amount',
    total: 'Total',
    details: 'Details',
    actions: 'Actions',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    new: 'New',
    view: 'View',
    all: 'All',
    filter: 'Filter',
    search: 'Search',
    export: 'Export',
    import: 'Import',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    close: 'Close',
    optional: 'Optional',
    required: 'Required',
    noData: 'No data',
    empty: 'Empty',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    logout: 'Log Out',
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Manage your application preferences',
    installApp: 'Install App',
    installAppDescription: 'Install CasaPilot as a Progressive Web App on your device for a better experience.',
    alreadyInstalled: 'App is already installed',
    installIOS: 'Install on iOS',
    installIOSSteps: '1. Tap the Share button\n2. Select "Add to Home Screen"\n3. Tap "Add"',
    installAndroid: 'Install on Android',
    installAndroidSteps: '1. Tap the menu (three dots)\n2. Select "Install app" or "Add to Home Screen"\n3. Tap "Install"',
    installDesktop: 'Install on Desktop',
    installDesktopSteps: '1. Click the install icon in your browser\'s address bar\n2. Or use the browser menu to install',
    general: 'General',
    advanced: 'Advanced',
    dangerousActions: 'Dangerous Actions',
    dangerousActionsDescription: 'Actions that cannot be undone',
    comingSoon: 'Coming soon',
    language: 'Language',
    languageDescription: 'Change the application language',
    selectLanguage: 'Select Language',
    spanish: 'Spanish',
    english: 'English',
  },

  // Property Selector
  propertySelector: {
    selectProperty: 'Select Property',
    noProperties: 'No properties available',
    propertyChanged: 'Property changed to {name}',
    propertyDeleted: 'Property deleted successfully',
    errorDeletingProperty: 'Error deleting property',
  },

  // Reset Data
  resetData: {
    adminTools: 'Admin Tools',
    description: 'Reset all application data. This action cannot be undone.',
    resetAllData: 'Reset All Data',
    confirmTitle: 'Confirm Reset',
    warning: 'This will permanently delete:',
    expenses: 'All expenses',
    maintenanceTickets: 'All maintenance tickets',
    bookings: 'All bookings',
    purchaseItems: 'All purchase items',
    inventoryItems: 'All inventory items',
    vendors: 'All vendors',
    allFilesInStorage: 'All files in storage',
    cannotUndone: 'This action cannot be undone.',
    typeReset: 'Type <strong>RESET</strong> to confirm:',
    confirmationRequired: 'You must type RESET to confirm',
    resetting: 'Resetting...',
    confirmReset: 'Confirm Reset',
    resetSuccess: 'All data has been reset successfully',
    resetError: 'Error resetting data',
  },

  // Errors
  errors: {
    authRequired: 'Authentication required',
    generic: 'An error occurred',
    network: 'Network error. Please check your connection.',
  },
}

// Helper function para acceder a traducciones con interpolación
export function t(key: string, params?: Record<string, any>): string {
  const keys = key.split('.')
  let value: any = enTranslations
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`)
      return key
    }
  }
  
  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`)
    return key
  }
  
  // Interpolación simple
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match
    })
  }
  
  return value
}

// Export default para uso directo
export const en = {
  ...enTranslations,
  t,
}
