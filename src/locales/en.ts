export const en = {
  // Navigation
  home: 'Home',
  connections: 'Connections',
  categories: 'Categories',
  
  // Common actions
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  back: '',
  close: 'Close',
  confirm: 'Confirm',
  reject: 'Reject',
  restore: 'Restore',
  clear: 'Clear',
  search: 'Search',
  searchByName: 'Search by name',
  searchTagsPlaceholder: 'Search tags and categories...',
  
  // Dream related
  dream: 'Dream',
  dreams: 'Dreams',
  dreamCalendar: 'Dream Activity',
  dreamsOnDate: '{count} dream(s) on {date}',
  noDreamsOnDate: 'No dreams on {date}',
  less: 'Less',
  more: 'More',
  dreamTitle: 'Dream title',
  dreamContent: 'Dream content',
  dreamDate: 'Dream date',
  dreamNotFound: 'Dream not found',
  backToDreams: 'Back to Dreams',
  describeYourDream: 'Describe your dream in detail... Let your thoughts flow naturally... use @ to cite dreams',
  addCategory: 'Add Category...',
  category: 'Category',
  uncategorized: 'Uncategorized',
  manageCategories: 'Manage Categories',
  createCategory: 'Create Category',
  editCategory: 'Edit Category',
  deleteCategory: 'Delete Category',
  categoryName: 'Category name',
  categoryColor: 'Category color',
  confirmDeleteCategory: 'Delete this category?',
  noCategoriesYet: 'No categories yet',
  createNewCategory: 'Create new category',
  newTag: 'New Tag',
  selectCategory: 'Select category',
  searchOrCreateTag: 'Search existing tags or create a new one...',
  noTagsYet: 'No tags yet',
  tagsWillAppear: 'Tags will appear here as you add them',
  noNewTags: 'No new tags were generated',
  noTitleGenerated: 'No title was generated',
  pleaseAddContent: 'Please add some dream content first',
  
  // AI Features
  aiFeatures: 'AI Features',
  aiFeaturesDescription: 'Enable AI Features',
  enableAI: 'Enable AI Features',
  aiProvider: 'AI Provider',
  chooseAI: 'Choose your AI service',
  gemini: 'Gemini',
  geminiDescription: 'Google\'s cloud-based AI',
  lmStudio: 'LM Studio',
  lmStudioDescription: 'Local AI models',
  suggestions: 'Suggestions',
  thinking: 'Thinking...',
  suggestion: 'Suggestion',
  
  // AI Instructions
  geminiInstructions: {
    title: 'Google Gemini',
    description: 'Use Google\'s Gemini AI for automatic tag generation',
    steps: [
      '1. Visit Google AI Studio (https://aistudio.google.com/)',
      '2. Sign in and click "Get API Key"',
      '3. Copy your API key and paste it below',
      '4. Enter your preferred model name (e.g., gemini-2.0-flash)'
    ]
  },
  lmStudioInstructions: {
    title: 'LM Studio',
    description: 'Use local models through LM Studio for privacy',
    steps: [
      '1. Download and install LM Studio',
      '2. Load your preferred model',
      '3. Start the local server (usually runs on localhost:1234)',
      '4. Enter the completion endpoint URL',
      '5. Enter your model name as configured in LM Studio'
    ]
  },
  
  // Configuration
  configurations: 'Configurations',
  apiConfiguration: 'API Configuration',
  setupCredentials: 'Set up your API credentials',
  apiKey: 'API Key',
  modelName: 'Model Name',
  completionEndpoint: 'Completion Endpoint',
  enterGeminiKey: 'Enter your Gemini API key',
  enterModelName: 'e.g., gemini-2.0-flash',
  enterEndpoint: 'e.g., http://localhost:1234/v1/chat/completions',
  enterLocalModel: 'e.g., local-model',
  saveConfiguration: 'Save Configuration',
  saving: 'Saving...',
  
  // Data Management
  dataManagement: 'Data',
  dataManagementDescription: 'Export and import your dreams data',
  exportData: 'Export Data',
  exportDescription: 'Export all your dreams and trashed dreams to a JSON file',
  importData: 'Import Data',
  importDescription: 'Import dreams from a JSON file (will merge with existing data)',
  exporting: 'Exporting...',
  importing: 'Importing...',
  exportSuccess: 'Data exported successfully',
  exportError: 'Failed to export data',
  importSuccess: 'Successfully imported {count} dream(s)',
  importError: 'Failed to import data',
  invalidFile: 'Invalid file format',
  dreamsCount: 'Dreams',
  trashCount: 'Trash',
  
  // Lockscreen
  lockscreen: 'Lockscreen',
  password: 'Password',
  setPassword: 'Set Password',
  enterPassword: 'Enter password',
  confirmPassword: 'Confirm password',
  passwordsDoNotMatch: 'Passwords do not match',
  passwordSet: 'Password set successfully',
  passwordRemoved: 'Password removed successfully',
  wrongPassword: 'Wrong password',
  unlock: 'Unlock',
  welcomeToDreamWeave: 'Welcome to DreamWeave',
  createPasswordToProtect: 'Create a password to protect your dreams',
  enterPasswordToContinue: 'Enter your password to continue',
  creating: 'Creating...',
  unlocking: 'Unlocking...',
  createPassword: 'Create Password',
  noPasswordRecovery: 'Important: There is no password recovery option. If you forget your password, you\'ll need to reset the app data.',
  lockscreenOptions: 'Lockscreen Options',
  configureLockscreen: 'Configure your lockscreen settings',
  autoLockTimeout: 'Auto-lock timeout (minutes)',
  autoLockDescription: 'App will automatically lock after this many minutes of inactivity (1-60 minutes)',
  currentStatus: 'Current Status',
  autoLockCurrent: 'Auto-lock: {timeout} minutes',
  saveSettings: 'Save Settings',
  
  // Trash
  trash: 'Trash',
  trashedDreams: 'Trashed Dreams',
  permanentlyDelete: 'Permanently Delete',
  clearTrash: 'Clear Trash',
  restoreDream: 'Restore Dream',
  deleteDream: 'Delete Dream',
  deleteDreamConfirm: 'Are you sure you want to delete "{title}"? This action will move it to the trash.',
  
  // Citations
  citations: 'Citations',
  dreamCitations: 'Dream Citations',
  citedDreams: 'Cited Dreams',
  dreamsThatCite: 'Dreams that cite this dream',
  searchDreamsToCite: 'Search dreams to cite...',
  noDreamsFound: 'No dreams found',
  noDreamsAvailable: 'No dreams available to cite',
  addCitation: 'Add Citation',
  removeCitation: 'Remove Citation',
  dreamPreview: 'Dream Preview',
  
  // Date picker
  today: 'Today',
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  
  // AI Tag suggestions
  categorySuggestions: 'Categories Suggestions',
  addNewTag: 'Add a new tag...',
  addNewTagPlaceholder: 'Add a new tag...',
  noTagsSuggested: 'No tags suggested yet',
  addTagsManually: 'Add tags manually above',
  addTags: 'Add {count} Tag{plural}',
  
  // AI Title suggestions
  aiTitleSuggestion: 'Title Suggestion',
  aiSuggestsTitle: 'The system suggests this title for your dream:',
  useThisTitle: 'Use This Title',
  tryDifferentTitle: 'Try Different Title',
  
  // Auto-save
  savingChanges: 'Saving changes...',
  allChangesSaved: 'All changes are automatically saved',
  
  // Errors
  aiDisabled: 'AI is disabled',
  geminiRequiresKey: 'Gemini requires API key and model name',
  lmStudioRequiresEndpoint: 'LM Studio requires endpoint and model name',
  unsupportedProvider: 'Unsupported AI provider',
  failedToGenerateTags: 'Failed to generate tags with AI',
  failedToGenerateTitle: 'Failed to generate title with AI',
  failedToConnectGemini: 'Failed to connect to Gemini API',
  failedToConnectLMStudio: 'Failed to connect to LM Studio API',
  noResponseFromAI: 'No response from AI',
  
  // Footer
  dreamsStoredLocally: 'Your dreams are stored locally',
  
  // Language
  language: 'Language',
  english: 'English',
  portuguese: 'Portuguese (Brazil)',
  choosePreferredLanguage: 'Choose your preferred language',

  // Graph/Connections
  filters: 'Filters',
  tags: 'Tags',
  searchDreams: 'Search Dreams',
  searchDreamTitles: 'Search dream titles...',
  controls: 'Controls',
  centerView: 'Center View',
  showIsolated: 'Show Isolated',
  hideIsolated: 'Hide Isolated',
  noDreamsToDisplay: 'No Dreams to Display',
  tryAdjustingFilters: 'Try adjusting your filters to see more dreams.',
  createDreamsAndCitations: 'Create some dreams and add citations to see connections.',
  nodes: 'Nodes',
  size: 'Size',
  clickToViewDetails: 'Click to view details',
  
  // Category Analysis
  categoryAnalysis: 'Category Analysis',
  categoryNetwork: 'Category Network',
  categoryNetworkDescription: 'Visualize relationships between dream categories',
  overview: 'Overview',
  relationships: 'Relationships',
  correlations: 'Correlations',
  trends: 'Trends',
  usage: 'Usage',
  percentage: 'Percentage',
  avgPerDream: 'Avg per Dream',
  categoryCoOccurrences: 'Category Co-occurrences',
  coOccurrences: 'Co-occurrences',
  strength: 'Strength',
  correlationMatrix: 'Correlation Matrix',
  categoryTrends: 'Category Trends',
  trendsComingSoon: 'Trend analysis coming soon',
  minimumStrength: 'Minimum Strength',
  showingLinks: 'Showing Links',
  linkStrength: 'Link Strength',
  noCategoriesFound: 'No Categories Found',
  addDreamsWithTags: 'Add dreams with tags to see category relationships',
  ofDreams: 'of dreams',
  
  // Category Insights
  categoryInsights: 'Category Insights',
  detailedAnalysis: 'Detailed Analysis',
  networkVisualization: 'Network Visualization',
  categoryOverviewDescription: 'Get a quick overview of your dream categories',
  categoryAnalysisDescription: 'Deep dive into category relationships and patterns',
  backToOverview: '',
  totalTags: 'Total Tags',
  categoriesUsed: 'Categories Used',
  explore: 'Explore',
  insightsTips: 'Insights Tips',
  understandingRelationships: 'Understanding Relationships',
  relationshipsTip: 'Category relationships show how different aspects of your dreams connect and influence each other.',
  usingInsights: 'Using Insights',
  insightsUsageTip: 'Use these insights to identify patterns, themes, and recurring elements in your dream journal.',
  
  // Tag Analysis
  tagAnalysis: 'Tag Analysis',
  uniqueTags: 'Unique Tags',
  totalTagUsage: 'Total Tag Usage',
  totalDreams: 'Total Dreams',
  avgTagsPerDream: 'Avg tags per dream',
  customTags: 'Custom Tags',
  filterByCategory: 'Filter by Category',
  allCategories: 'All Categories',
  tagCoOccurrences: 'Tag Co-occurrences',
  tagTrends: 'Tag Trends',
  noTagsFound: 'No Tags Found',
  customTag: 'Custom Tag',
  uses: 'uses',
  tagInsights: 'Insights',
  tagOverviewDescription: 'Get a quick overview of your dream tags',
  tagAnalysisDescription: 'Deep dive into tag relationships and patterns',
  mostUsedTags: 'Most Used Tags',
  
  // Layout
  layout: 'Layout',
  force: 'Force',
  circular: 'Circular',
  hierarchical: 'Hierarchical',
  
  // Date Range
  dateRange: 'Date Range',
  startDate: 'Start Date',
  endDate: 'End Date',
  selectedTags: 'Selected Tags',
  clearFilters: 'Clear Filters',
  
  // Placeholders
  searchPlaceholder: 'Search dreams...',
  titlePlaceholder: 'Dream title...',
  contentPlaceholder: 'Describe your dream in detail...',
  tagPlaceholder: 'Add Category...',
  newTagPlaceholder: 'Add a new tag...',
  
  // Status messages
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Information',
  
  // Notifications
  dreamCreated: 'Dream created successfully',
  dreamUpdated: 'Dream updated successfully',
  dreamDeleted: 'Dream moved to trash',
  dreamRestored: 'Dream restored successfully',
  dreamPermanentlyDeleted: 'Dream permanently deleted',
  trashCleared: 'Trash cleared',
  configurationSaved: 'Configuration saved successfully',
  passwordChanged: 'Password changed successfully',
  languageChanged: 'Language changed successfully',
  
  // Validation
  titleRequired: 'Title is required',
  contentRequired: 'Content is required',
  dateRequired: 'Date is required',
  passwordRequired: 'Password is required',
  passwordMinLength: 'Password must be at least 4 characters',
  passwordMaxLength: 'Password must be at most 20 characters',
  apiKeyRequired: 'API key is required',
  modelNameRequired: 'Model name is required',
  endpointRequired: 'Endpoint is required',
  
  // Empty states
  noDreams: 'No dreams yet',
  createFirstDream: 'Create your first dream to get started',
  noResults: 'No results found',
  tryDifferentSearch: 'Try a different search term',
  noCitations: 'No citations yet',
  addCitations: 'Add citations to connect your dreams',
  
  // Tooltips
  addDream: 'Add new dream',
  editDream: 'Edit dream',
  addTag: 'Add tag',
  removeTag: 'Remove tag',
  generateTags: 'Generate tags with AI',
  generateTitle: 'Generate title with AI',
  filterByDate: 'Filter by date',
  filterByTag: 'Filter by tag',
  settings: 'Settings',
  lock: 'Lock',
  
  // Accessibility
  closeModal: 'Close modal',
  openModal: 'Open modal',
  toggleMenu: 'Toggle menu',
  selectOption: 'Select option',
  clearSelection: 'Clear selection',
  loadingContent: 'Loading content...',
  errorOccurred: 'An error occurred',
  retry: 'Retry',
  
  // Time
  justNow: 'Just now',
  minutesAgo: '{count} minute{plural} ago',
  hoursAgo: '{count} hour{plural} ago',
  daysAgo: '{count} day{plural} ago',
  weeksAgo: '{count} week{plural} ago',
  monthsAgo: '{count} month{plural} ago',
  yearsAgo: '{count} year{plural} ago',
  
  // Formatting
  dateFormat: 'MMM dd, yyyy',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'MMM dd, yyyy HH:mm',
  
  // Pluralization
  plural: {
    minute: ['minute', 'minutes'],
    hour: ['hour', 'hours'],
    day: ['day', 'days'],
    week: ['week', 'weeks'],
    month: ['month', 'months'],
    year: ['year', 'years'],
    tag: ['tag', 'tags'],
    dream: ['dream', 'dreams'],
    citation: ['citation', 'citations']
  }
};
