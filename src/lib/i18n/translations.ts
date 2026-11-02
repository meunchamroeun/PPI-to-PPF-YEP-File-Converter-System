export type Language = "kh" | "en";

export interface TranslationDictionary {
  [key: string]: {
    kh: string;
    en: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation & Brand
  app_title: {
    kh: "ស្ទូឌីយោបំលែងសំឡេង Yamaha",
    en: "Yamaha ExpVoice Studio",
  },
  app_subtitle: {
    kh: "កម្មវិធីគ្រប់គ្រងសំឡេង និងបំលែងឯកសារ PPI ទៅ PPF / YEP",
    en: "Yamaha Expansion Voice Manager & File Conversion Hub",
  },
  nav_dashboard: {
    kh: "ផ្ទាំងគ្រប់គ្រង",
    en: "Dashboard Overview",
  },
  nav_converter: {
    kh: "កម្មវិធីបំលែងឯកសារ",
    en: "File Converter Queue",
  },
  nav_inspector: {
    kh: "ត្រួតពិនិត្យកូដ Hex & Binary",
    en: "File & Hex Inspector",
  },
  nav_history: {
    kh: "ប្រវត្តិការបំលែង",
    en: "Conversion History",
  },
  nav_ai: {
    kh: "ជំនួយការ AI សំឡេង (Gemini)",
    en: "AI Sound Studio (Gemini)",
  },
  nav_settings: {
    kh: "ការកំណត់ & សោរ API",
    en: "Settings & API Key",
  },
  nav_admin: {
    kh: "ផ្ទាំងគ្រប់គ្រងរដ្ឋបាល",
    en: "Admin Console",
  },
  nav_architecture: {
    kh: "ប្លង់ស្ថាបត្យកម្ម & Tech Specs",
    en: "Backend & Tech Specs",
  },
  nav_admin_badge: {
    kh: "រដ្ឋបាល",
    en: "Admin",
  },
  nav_system_category: {
    kh: "ប្រព័ន្ធ និងការគ្រប់គ្រង",
    en: "System & Administration",
  },

  // Header & Global Controls
  hdr_commands: {
    kh: "ពាក្យបញ្ជា",
    en: "Commands",
  },
  hdr_ai_assistant: {
    kh: "ជំនួយការ AI",
    en: "AI Assistant",
  },
  hdr_load_sample: {
    kh: "ផ្ទុកគំរូ PPI",
    en: "Load Sample PPI",
  },
  hdr_test_cpi: {
    kh: "សាកល្បង CPI ការពារ",
    en: "Test Encrypted CPI",
  },
  hdr_telegram_ready: {
    kh: "ត្រៀម Telegram",
    en: "Telegram Ready",
  },
  hdr_telegram_live: {
    kh: "Telegram កំពុងដំណើរការ",
    en: "Mini App Live",
  },
  hdr_sign_in: {
    kh: "ចូលគណនី",
    en: "Sign In / Login",
  },
  hdr_sign_out: {
    kh: "ចាកចេញ",
    en: "Sign Out",
  },
  hdr_guest_user: {
    kh: "ភ្ញៀវ",
    en: "Guest User",
  },
  theme_light: {
    kh: "ប្តូរទៅពន្លឺថ្ងៃ",
    en: "Switch to Light Mode",
  },
  theme_dark: {
    kh: "ប្តូរទៅពន្លឺយប់",
    en: "Switch to Night Mode",
  },

  // Dashboard Overview
  dash_hero_tag: {
    kh: "ត្រូវគ្នាជាមួយ Yamaha Voice Expansion Manager",
    en: "Yamaha Voice Expansion Manager Compatible",
  },
  dash_hero_title: {
    kh: "ប្រព័ន្ធបំលែងឯកសារ PPI ទៅជា PPF & YEP កម្រិតស្តង់ដារខ្ពស់",
    en: "High-Fidelity PPI to PPF & YEP File Conversion",
  },
  dash_hero_desc: {
    kh: "ពន្លា និងស្រង់កញ្ចប់សំឡេងដំឡើងទៅជាឯកសារគម្រោង Yamaha Expansion Manager (Pack.xml, UVF scripts, និងរលកសំឡេង PCM WAV) ដោយសុក្រឹត្យភាពខ្ពស់។",
    en: "De-encapsulate compiled installation packs into editable Yamaha Expansion Manager project archives with genuine XML manifests, User Voice scripts (.uvf), and PCM waveforms.",
  },
  dash_btn_upload: {
    kh: "ផ្ទុកឡើង និងបំលែងឯកសារ",
    en: "Upload & Convert Files",
  },
  dash_btn_demo: {
    kh: "សាកល្បងគំរូក្នុងអង្គចងចាំ",
    en: "Try In-Memory Demo",
  },

  // Dashboard Stats
  stat_total_uploaded: {
    kh: "ឯកសារបានផ្ទុកឡើងសរុប",
    en: "Total Files Uploaded",
  },
  stat_total_converted: {
    kh: "បានបំលែងសរុប",
    en: "Total Converted",
  },
  stat_successful: {
    kh: "លទ្ធផលជោគជ័យ",
    en: "Successful Outputs",
  },
  stat_failed: {
    kh: "បរាជ័យ / ជាប់សោ DRM",
    en: "Failed / DRM Blocked",
  },
  stat_uploaded_sub: {
    kh: "គាំទ្រ: .ppi, .cpi",
    en: "Supported: .ppi, .cpi",
  },
  stat_converted_sub: {
    kh: "កញ្ចប់ដែលបានដំណើរការ",
    en: "Processed packages",
  },
  stat_successful_sub: {
    kh: "រចនាសម្ព័ន្ធត្រឹមត្រូវ ១០០%",
    en: "100% verified structures",
  },
  stat_failed_sub: {
    kh: "កញ្ចប់ជាប់សោការពារ .CPI",
    en: "Protected .CPI packs",
  },

  // Converter Queue
  queue_title: {
    kh: "ជួរដំណើរការបំលែងឯកសារ",
    en: "Conversion Processing Queue",
  },
  queue_subtitle: {
    kh: "កំណត់ទម្រង់ឯកសារលទ្ធផល និងបំលែងម្តងមួយ ឬជាក្រុម។",
    en: "Configure target formats and convert individually or in batch.",
  },
  queue_btn_convert_all: {
    kh: "បំលែងទាំងអស់",
    en: "Convert All",
  },
  queue_btn_download_all: {
    kh: "ទាញយកទាំងអស់ (.zip)",
    en: "Download All (.zip)",
  },
  queue_btn_clear: {
    kh: "សម្អាតជួរ",
    en: "Clear",
  },
  queue_dropzone_title: {
    kh: "អូស & ទម្លាក់ឯកសារសំឡេង Yamaha .PPI នៅទីនេះ",
    en: "Drag & drop your Yamaha .PPI expansion files here",
  },
  queue_dropzone_desc: {
    kh: "ទទួលយកឯកសារកញ្ចប់សំឡេងដំឡើង Yamaha (.ppi) និងឯកសារការពារ (.cpi)។ អាចផ្ទុកឯកសារច្រើនក្នុងពេលតែមួយ។",
    en: "Accepts Yamaha Pack Project Installation files (.ppi) and Protected Packs (.cpi). Multiple file upload enabled.",
  },
  queue_dropzone_btn: {
    kh: "ជ្រើសរើសឯកសារពីកុំព្យូទ័រ",
    en: "Select Files from Computer",
  },
  queue_drm_toggle: {
    kh: "ការពារសោរ DRM យ៉ាងម៉ឺងម៉ាត់",
    en: "Strict DRM Safeguard",
  },
  queue_table_file: {
    kh: "ឯកសារ",
    en: "File",
  },
  queue_table_size: {
    kh: "ទំហំ",
    en: "Size",
  },
  queue_table_target: {
    kh: "ទម្រង់លទ្ធផល",
    en: "Target Format",
  },
  queue_table_status: {
    kh: "ស្ថានភាព",
    en: "Status",
  },
  queue_table_actions: {
    kh: "សកម្មភាព",
    en: "Actions",
  },

  // Inspector View
  insp_title: {
    kh: "ឧបករណ៍ត្រួតពិនិត្យ Binary & Hex",
    en: "Binary & Chunk Inspector",
  },
  insp_subtitle: {
    kh: "ពិនិត្យមើលលំហូរទិន្នន័យ Byte នៃ PAC, តារាង Chunk, និងទម្រង់ PPF XML។",
    en: "Examine raw PAC byte stream, chunk index, and generated PPF XML.",
  },
  insp_inspecting: {
    kh: "កំពុងពិនិត្យ:",
    en: "Inspecting:",
  },
  insp_header_card: {
    kh: "ព័ត៌មានក្បាលឯកសារ (Header)",
    en: "Header Descriptor",
  },
  insp_signature: {
    kh: "ហត្ថលេខាឯកសារ",
    en: "Signature",
  },
  insp_version: {
    kh: "ជំនាន់ទម្រង់",
    en: "Format Version",
  },
  insp_pack_name: {
    kh: "ឈ្មោះកញ្ចប់",
    en: "Pack Name",
  },
  insp_target_model: {
    kh: "ម៉ូដែលគោលដៅ",
    en: "Target Model",
  },
  insp_drm_status: {
    kh: "ស្ថានភាព DRM",
    en: "DRM Status",
  },
  insp_voices_count: {
    kh: "ចំនួនសំឡេង (Voices)",
    en: "Voices Count",
  },
  insp_styles_count: {
    kh: "ចំនួនចង្វាក់ (Styles)",
    en: "Styles Count",
  },
  insp_waves_count: {
    kh: "រលកសំឡេង (Wave Samples)",
    en: "Wave Samples",
  },
  insp_chunks_card: {
    kh: "បណ្តុំ Chunks ដែលរកឃើញ",
    en: "Parsed Chunks",
  },
  insp_hex_card: {
    kh: "ទិន្នន័យ Byte Hex Dump (៥១២ Bytes ដំបូង)",
    en: "Raw Byte Hex Dump (First 512 Bytes)",
  },
  insp_xml_card: {
    kh: "ឯកសារ Pack.xml Manifest ដែលបានបង្កើត",
    en: "Generated Pack.xml Manifest",
  },
  insp_no_file: {
    kh: "មិនទាន់មានឯកសារជ្រើសរើសសម្រាប់ត្រួតពិនិត្យទេ",
    en: "No File Selected for Inspection",
  },

  // History Archive
  hist_title: {
    kh: "ប្រវត្តិការបំលែងឯកសារ",
    en: "Conversion History Archive",
  },
  hist_subtitle: {
    kh: "កំណត់ត្រាការបំលែងឯកសារ PPI ទាំងអស់ ស្ថានភាព និងតំណទាញយក។",
    en: "Complete audit log of all PPI conversions, statuses, and generated download links.",
  },
  hist_guest_banner_title: {
    kh: "អ្នកកំពុងប្រើប្រាស់ជាភ្ញៀវ",
    en: "You are currently browsing as Guest",
  },
  hist_guest_banner_desc: {
    kh: "សូមចូលគណនីដើម្បីរក្សាទុកប្រវត្តិការងាររបស់អ្នក និងធ្វើសមកាលកម្មលើពពក (Cloud Database)។",
    en: "Sign in to sync your conversion history across sessions, enable cloud database backups, and access administrative oversight.",
  },
  hist_scope_my: {
    kh: "ប្រវត្តិរបស់ខ្ញុំ",
    en: "My Conversions",
  },
  hist_scope_all: {
    kh: "អ្នកប្រើទាំងអស់ (រដ្ឋបាល)",
    en: "All Users (Admin View)",
  },
  hist_export_csv: {
    kh: "នាំចេញ CSV",
    en: "Export CSV",
  },
  hist_clear_all: {
    kh: "លុបប្រវត្តិទាំងអស់",
    en: "Clear All History",
  },
  hist_search_placeholder: {
    kh: "ស្វែងរកតាមឈ្មោះឯកសារ ឬកញ្ចប់សំឡេង...",
    en: "Search by file name or pack title...",
  },
  hist_filter_all: {
    kh: "គ្រប់ស្ថានភាព",
    en: "All Statuses",
  },
  hist_filter_success: {
    kh: "ជោគជ័យ",
    en: "Successful",
  },
  hist_filter_failed: {
    kh: "បរាជ័យ",
    en: "Failed",
  },
  hist_col_name: {
    kh: "ឈ្មោះឯកសារដើម",
    en: "Original File",
  },
  hist_col_user: {
    kh: "អ្នកប្រើប្រាស់",
    en: "User",
  },
  hist_col_size: {
    kh: "ទំហំ",
    en: "File Size",
  },
  hist_col_type: {
    kh: "ប្រភេទបំលែង",
    en: "Conversion Type",
  },
  hist_col_status: {
    kh: "ស្ថានភាព",
    en: "Status",
  },
  hist_col_date: {
    kh: "កាលបរិច្ឆេទ",
    en: "Conversion Date",
  },
  hist_col_action: {
    kh: "ទាញយក",
    en: "Download Action",
  },

  // Voice Player & Synthesizer
  player_title: {
    kh: "ឧបករណ៍សាកល្បងសំឡេង Yamaha AWM2 Synthesizer",
    en: "Yamaha AWM2 Voice Audition Player",
  },
  player_subtitle: {
    kh: "ស្តាប់ និងលេងសំឡេងឧបករណ៍តន្ត្រី Yamaha ដោយផ្ទាល់នៅលើកម្មវិធីអ៊ីនធឺណិត។",
    en: "Play simulated Yamaha voice textures & test tone frequencies directly in your browser.",
  },
  player_btn_audition: {
    kh: "ស្តាប់សំឡេងសាកល្បង",
    en: "Audition Phrase",
  },
  player_btn_stop: {
    kh: "បញ្ឈប់",
    en: "Stop Demo",
  },
  player_voice_models: {
    kh: "គំរូសំឡេង AWM2",
    en: "AWM2 Voice Models",
  },
  player_virtual_keyboard: {
    kh: "ក្តារចុចព្យាណូ (ប៉ះ ឬចុចដើម្បីលេង)",
    en: "Virtual Keyboard (Touch or Click to Play)",
  },
  player_cutoff: {
    kh: "កម្រិត Filter Cutoff",
    en: "AWM2 Filter Cutoff",
  },
  player_resonance: {
    kh: "កម្រិត Resonance (Q)",
    en: "Filter Resonance (Q)",
  },

  // Settings & Gemini API Key
  set_title: {
    kh: "ការកំណត់ប្រព័ន្ធ & សោរ API",
    en: "Settings & API Key Management",
  },
  set_subtitle: {
    kh: "គ្រប់គ្រងសោរ Google Gemini AI Studio, ចំណង់ចំណូលចិត្តការបំលែង និងគណនីរបស់អ្នក។",
    en: "Manage Gemini AI Studio credentials, conversion engine preferences, and your account profile.",
  },
  set_profile_title: {
    kh: "កម្រងព័ត៌មានគណនី",
    en: "Account Profile",
  },
  set_btn_switch_admin: {
    kh: "ប្តូរទៅជា Master Admin",
    en: "Switch to Master Admin",
  },
  set_btn_switch_user: {
    kh: "ប្តូរទៅជាអ្នកប្រើទូទៅ",
    en: "Switch to Standard User",
  },
  set_btn_switch_account: {
    kh: "ប្តូរ / ចូលគណនីផ្សេង",
    en: "Switch / Sign In Account",
  },
  set_gemini_title: {
    kh: "សោរ API របស់ Google Gemini AI",
    en: "Google Gemini AI API Key",
  },
  set_gemini_desc: {
    kh: "ប្រើសម្រាប់វិភាគប៉ារ៉ាម៉ែត្រសំឡេង AWM2 និងពិនិត្យភាពត្រូវគ្នានៃឧបករណ៍តន្ត្រីចាស់ៗ។",
    en: "Powers real-time AWM2 voice parameter analysis, legacy compatibility diagnostics, and metadata extraction.",
  },
  set_gemini_status_active: {
    kh: "បានកំណត់សោរសកម្ម",
    en: "Active Key Configured",
  },
  set_gemini_status_not_set: {
    kh: "មិនទាន់កំណត់សោរទេ",
    en: "API Key Not Set",
  },
  set_gemini_input_label: {
    kh: "សោរ API (Google AI Studio / Vertex AI)",
    en: "API Key (AI Studio / Vertex AI)",
  },
  set_gemini_get_free: {
    kh: "យកសោរឥតគិតថ្លៃ",
    en: "Get a free key",
  },
  set_btn_test_conn: {
    kh: "សាកល្បងការតភ្ជាប់",
    en: "Test Connection",
  },
  set_btn_save_key: {
    kh: "រក្សាទុកសោរ",
    en: "Save Key",
  },
  set_btn_clear_key: {
    kh: "លុបសោរ",
    en: "Clear Key",
  },
  set_pref_title: {
    kh: "ចំណង់ចំណូលចិត្តម៉ាស៊ីនបំលែង",
    en: "Conversion Engine Preferences",
  },
  set_pref_default_container: {
    kh: "ប្រភេទឯកសារលទ្ធផលលំនាំដើម",
    en: "Default Target Container",
  },
  set_pref_strict_drm: {
    kh: "ការត្រួតពិនិត្យសោរ CPI / DRM យ៉ាងតឹងរ៉ឹង",
    en: "Strict CPI & DRM Protection Check",
  },
  set_pref_auto_download: {
    kh: "ទាញយកឯកសារដោយស្វ័យប្រវត្តិពេលចប់",
    en: "Automatic File Download",
  },
  set_pref_visualizer: {
    kh: "បង្ហាញរលកសំឡេង Audio Visualizer",
    en: "Audio Sample Waveform Visualizer",
  },

  // Admin Console
  admin_title: {
    kh: "ផ្ទាំងគ្រប់គ្រងរដ្ឋបាលប្រព័ន្ធ",
    en: "Admin Management Console",
  },
  admin_subtitle: {
    kh: "គ្រប់គ្រងអ្នកប្រើប្រាស់ តាមដានសុខភាពម៉ាស៊ីនមេ និងត្រួតពិនិត្យការបំលែងសកល។",
    en: "User directory oversight, cluster health metrics, and global conversion audit trails.",
  },
  admin_btn_export_audit: {
    kh: "នាំចេញកំណត់ត្រា JSON",
    en: "Export Audit JSON",
  },
  admin_btn_refresh: {
    kh: "ផ្ទុកទិន្នន័យឡើងវិញ",
    en: "Refresh Telemetry",
  },
  admin_card_users: {
    kh: "គណនីបានចុះឈ្មោះ",
    en: "Registered Accounts",
  },
  admin_card_jobs: {
    kh: "ការបំលែងសកល",
    en: "Global Conversions",
  },
  admin_card_pg: {
    kh: "បណ្តុំទិន្នន័យ PostgreSQL",
    en: "PostgreSQL Cluster",
  },
  admin_card_redis: {
    kh: "ជួរផ្ទុកបណ្តោះអាសន្ន Redis",
    en: "Redis Queue & Cache",
  },
  admin_users_table_title: {
    kh: "បញ្ជីគ្រប់គ្រងអ្នកប្រើប្រាស់",
    en: "User Management Directory",
  },
  admin_users_table_subtitle: {
    kh: "កំណត់សិទ្ធិអ្នកគ្រប់គ្រង ផ្អាកគណនី ឬលុបចេញពីប្រព័ន្ធ។",
    en: "Manage user authorization roles, grant admin privileges, or suspend abusive accounts.",
  },
  admin_btn_add_user: {
    kh: "បន្ថែមអ្នកប្រើថ្មី",
    en: "Add New User",
  },
  admin_stream_title: {
    kh: "លំហូរត្រួតពិនិត្យការបំលែងសកល",
    en: "Global Conversions Audit Stream",
  },
  admin_stream_subtitle: {
    kh: "កំណត់ត្រាការបំលែងទាំងអស់ពីអ្នកប្រើប្រាស់ និង Telegram Bot។",
    en: "Auditable conversion log across all connected users and Telegram bots.",
  },

  // Language Switcher
  lang_kh: {
    kh: "ភាសាខ្មែរ",
    en: "Khmer",
  },
  lang_en: {
    kh: "អង់គ្លេស",
    en: "English",
  },

  // Common Button Actions
  btn_convert: {
    kh: "បំលែង",
    en: "Convert",
  },
  btn_cancel: {
    kh: "បោះបង់",
    en: "Cancel",
  },
  btn_download: {
    kh: "ទាញយក",
    en: "Download",
  },
  btn_retry: {
    kh: "ព្យាយាមម្តងទៀត",
    en: "Retry",
  },
  btn_rerun: {
    kh: "ដំណើរការឡើងវិញ",
    en: "Re-run",
  },
  btn_inspect: {
    kh: "ត្រួតពិនិត្យ",
    en: "Inspect",
  },
  queue_empty_title: {
    kh: "ជួរដំណើរការបំលែងនៅទំនេរ",
    en: "Conversion Queue is Empty",
  },
  queue_empty_desc: {
    kh: "សូមអូសនិងទម្លាក់ឯកសារ .PPI មកទីនេះ ឬសាកល្បងជាមួយគំរូដែលបង្កើតស្រាប់។",
    en: "Add Yamaha PPI files via drag-and-drop above, or test right now using our built-in sample generators.",
  },
  queue_files_count: {
    kh: "ឯកសារក្នុងជួរ",
    en: "Files in Queue",
  },

  // Auth Modal
  auth_modal_title: {
    kh: "ចូលគណនីប្រើប្រាស់",
    en: "Sign In to Your Account",
  },
  auth_modal_desc: {
    kh: "ជ្រើសរើសវិធីចូលគណនី Google, Telegram, ឬសាកល្បងដោយផ្ទាល់។",
    en: "Sign in with Google, Telegram, or choose a one-click demo profile.",
  },
  auth_tab_quick: {
    kh: "ចូលរហ័ស (Demo)",
    en: "Quick Demo",
  },
  auth_tab_oauth: {
    kh: "Google / Telegram",
    en: "Google / Telegram",
  },
  auth_tab_email: {
    kh: "អ៊ីមែល & ពាក្យសម្ងាត់",
    en: "Email & Password",
  },
  auth_btn_admin_demo: {
    kh: "ចូលជា Admin គ្រប់គ្រង",
    en: "Sign In as Master Admin",
  },
  auth_btn_artist_demo: {
    kh: "ចូលជាអ្នកប្រើតន្ត្រីករ",
    en: "Sign In as Keyboard Artist",
  },
  auth_btn_tg_demo: {
    kh: "ចូលតាមគណនី Telegram",
    en: "Sign In via Telegram",
  },
  auth_btn_google: {
    kh: "ចូលតាមគណនី Google",
    en: "Continue with Google",
  },
  auth_btn_telegram: {
    kh: "ចូលតាម Telegram Login Widget",
    en: "Continue with Telegram",
  },
  auth_btn_guest: {
    kh: "បន្តប្រើប្រាស់ជាភ្ញៀវ",
    en: "Continue as Guest",
  },
  auth_sign_out: {
    kh: "ចាកចេញពីគណនី",
    en: "Sign Out of Studio",
  },

  // Command Palette
  cmd_search_placeholder: {
    kh: "វាយពាក្យបញ្ជា ឬស្វែងរក...",
    en: "Type a command or search...",
  },
  cmd_group_navigation: {
    kh: "ការរុករកទំព័រ",
    en: "Navigation",
  },
  cmd_group_actions: {
    kh: "សកម្មភាពរហ័ស",
    en: "Actions",
  },
  cmd_group_theme: {
    kh: "ផ្ទៃពណ៌",
    en: "Appearance",
  },
  cmd_convert_all: {
    kh: "បំលែងឯកសារទាំងអស់ក្នុងជួរ",
    en: "Convert All Pending Items",
  },
  cmd_load_sample: {
    kh: "ផ្ទុកគំរូ PPI ដោយស្វ័យប្រវត្តិ",
    en: "Load Synthetic Sample PPI",
  },
  cmd_test_cpi: {
    kh: "សាកល្បងឯកសារជាប់សោរ CPI",
    en: "Test Encrypted CPI Handling",
  },
  cmd_tg_preview: {
    kh: "បើកផ្ទាំងគំរូ Telegram Mini App",
    en: "Preview Telegram Mini App",
  },

  // DRM Safeguard Modal
  drm_modal_title: {
    kh: "រកឃើញឯកសារ Yamaha ដែលមានការការពារ",
    en: "Protected Yamaha Content Detected",
  },
  drm_modal_desc: {
    kh: "កញ្ចប់នេះជាឯកសារពាណិជ្ជកម្មដែលមានការអ៊ិនគ្រីប (.cpi) ភ្ជាប់ជាមួយលេខកូដម៉ាស៊ីន (.n27)។",
    en: "This package is an encrypted commercial expansion (.cpi) tied to an Instrument Info (.n27) hardware signature.",
  },
  drm_modal_rule: {
    kh: "យោងតាមច្បាប់បំលែង ExpVoice Studio នឹងមិនបង្កើតឯកសារខូច ឬឯកសារក្លែងក្លាយនៅពេលដែលគ្មានសោរសម្ងាត់ពិតប្រាកដឡើយ។",
    en: "In accordance with conversion rules, ExpVoice Studio will not generate corrupted or dummy output when valid private decryption keys are absent.",
  },
  drm_modal_btn: {
    kh: "យល់ព្រម",
    en: "Understood",
  },

  // AI Agent & Vercel AI SDK
  ai_agent_title: {
    kh: "ភ្នាក់ងារ AI សំឡេង Yamaha (Vercel AI SDK)",
    en: "Yamaha Expansion Sound AI Agent (Vercel AI SDK)",
  },
  ai_agent_subtitle: {
    kh: "ភ្នាក់ងារស្វ័យប្រវត្តិនឹងពិនិត្យរចនាសម្ព័ន្ធ Chunks គណនា AWM2 Filter Curves និងផ្ទៀងផ្ទាត់ភាពត្រូវគ្នា YEP",
    en: "Autonomous agent inspecting container chunks, calculating AWM2 filter curves, and evaluating legacy YEP compatibility",
  },
  ai_agent_model_badge: {
    kh: "Gemini 2.5 Flash",
    en: "Gemini 2.5 Flash",
  },
  ai_agent_sdk_badge: {
    kh: "Vercel AI SDK v7",
    en: "Vercel AI SDK v7",
  },
  ai_agent_tools_badge: {
    kh: "ឧបករណ៍ស្វ័យប្រវត្តិចំនួន ៥",
    en: "5 Autonomous Tools",
  },
  ai_quick_audit: {
    kh: "វិភាគបច្ចេកទេសកញ្ចប់",
    en: "Full Technical Audit",
  },
  ai_quick_filter: {
    kh: "គណនា AWM2 Filter & Envelope",
    en: "Calculate AWM2 Filter & Envelope",
  },
  ai_quick_yep: {
    kh: "ពិនិត្យភាពត្រូវគ្នា PSR-S950",
    en: "Check PSR-S950 YEP Compatibility",
  },
  ai_quick_midi: {
    kh: "បែងចែក MIDI Bank (MSB 063)",
    en: "Generate MIDI Bank Map (MSB 063)",
  },
  ai_quick_diagnose: {
    kh: "វិនិច្ឆ័យកំហុស & DRM Lock",
    en: "Diagnose Errors & DRM Lock",
  },
  ai_input_placeholder: {
    kh: "សួរភ្នាក់ងារ AI អំពីកញ្ចប់សំឡេង ឬ AWM2 Parameters...",
    en: "Ask Yamaha AI Agent about expansion packs or AWM2 parameters...",
  },
  ai_btn_send: {
    kh: "ផ្ញើសំណួរ",
    en: "Send Query",
  },
  ai_btn_stop: {
    kh: "បញ្ឈប់",
    en: "Stop",
  },
  ai_btn_clear: {
    kh: "សម្អាតការសន្ទនា",
    en: "Clear Chat",
  },
  ai_btn_export: {
    kh: "ទាញយក (.md)",
    en: "Export (.md)",
  },
  ai_tool_running: {
    kh: "កំពុងដំណើរការឧបករណ៍ស្វ័យប្រវត្តិ...",
    en: "Executing autonomous tool...",
  },
  ai_tool_finished: {
    kh: "បានបញ្ចប់ឧបករណ៍ស្វ័យប្រវត្តិ",
    en: "Tool execution completed",
  },
  ai_no_messages: {
    kh: "មិនទាន់មានការសន្ទនានៅឡើយទេ។ សូមចុចប៊ូតុងសកម្មភាពរហ័សខាងលើ ឬវាយសំណួររបស់អ្នក។",
    en: "No conversation history yet. Click a quick action preset above or type your question below.",
  },
  ai_key_settings: {
    kh: "កំណត់សោរ Gemini API",
    en: "Configure Gemini API Key",
  },
  ai_key_hint: {
    kh: "ទទួលបានសោរឥតគិតថ្លៃនៅ Google AI Studio",
    en: "Get a free API key from Google AI Studio",
  },
  ai_key_saved: {
    kh: "បានរក្សាទុកសោរក្នុងម៉ាស៊ីន",
    en: "Key saved in local storage",
  },
};

export function getTranslation(key: string, lang: Language): string {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  if (translations[key] && translations[key].en) {
    return translations[key].en;
  }
  return key;
}
