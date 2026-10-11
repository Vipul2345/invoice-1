# InvoiceFlow — Android & Windows Build and Packaging Guide

This guide describes how to compile and package **InvoiceFlow** into an **Android APK** and a **Windows Desktop Application (.exe)** for real-world user testing.

---

## Prerequisites & Development Tools

### For Android:
1. **Node.js**: v18+ or v20+ LTS
2. **Java Development Kit (JDK)**: JDK 17 or JDK 21 (recommended for modern Android Gradle Plugin 8+)
3. **Android Studio**: Latest version with **Android SDK Platform 34/35** and **Android SDK Build-Tools** installed
4. An Android physical test device (Android 8.0+ / API 26+) with *Developer options* and *USB debugging* enabled, or an Android Virtual Device (AVD) emulator.

### For Windows:
1. **Node.js**: v18+ or v20+ LTS
2. Operating System: Windows 10/11 (or Linux/macOS cross-compiling via `electron-builder`)
3. No code-signing certificate is required for testing builds (SmartScreen notice may appear upon first launch).

---

## 1. Android Packaging (Capacitor)

InvoiceFlow is configured with **Capacitor** under package identifier:
* **App Name**: `InvoiceFlow`
* **App ID**: `com.invoiceflow.app`
* **Native Root**: `android/`

### Step-by-Step Build Instructions:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Compile the production web assets**:
   ```bash
   npm run build
   ```

3. **Sync web assets and plugins to Android**:
   ```bash
   npm run build:android
   # (Runs: vite build && npx cap sync android)
   ```

4. **Compile the Debug APK**:
   * **Using Command Line (Linux / macOS)**:
     ```bash
     cd android
     ./gradlew assembleDebug
     ```
   * **Using Command Line (Windows)**:
     ```cmd
     cd android
     gradlew.bat assembleDebug
     ```
   * **Using Android Studio**:
     ```bash
     npx cap open android
     ```
     Once opened in Android Studio, select **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.

5. **Locate the Generated APK**:
   ```text
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

6. **Install on Test Device**:
   * **Via ADB**:
     ```bash
     adb install android/app/build/outputs/apk/debug/app-debug.apk
     ```
   * **Via Sideloading**:
     Send `app-debug.apk` directly via email, Google Drive, or USB file transfer to your test phone. Tap the APK file to install (allow *"Install unknown apps"* when prompted).

---

## 2. Windows Packaging (Electron)

InvoiceFlow uses a secured **Electron** main process with `contextIsolation: true`, `nodeIntegration: false`, and `electron-builder`.

### Step-by-Step Build Instructions:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build and package for Windows**:
   ```bash
   npm run build:windows
   # (Runs: vite build && electron-builder --win)
   ```

3. **To test locally without packing**:
   ```bash
   npm run electron:start
   ```

4. **Locate the Windows Executable & Installer**:
   * **Unpacked Portable Executable Directory**:
     ```text
     dist_electron/win-unpacked/InvoiceFlow.exe
     ```
   * **Standard NSIS Installer**:
     ```text
     dist_electron/InvoiceFlow Setup 1.0.0.exe
     ```
   * **Standalone Portable Single .exe**:
     ```text
     dist_electron/InvoiceFlow 1.0.0.exe
     ```

5. **Run & Test on Windows**:
   * Double click `InvoiceFlow.exe` or run the installer.
   * Because internal testing builds are not code-signed with an expensive commercial certificate, Windows SmartScreen may display: *"Windows protected your PC"*. Testers simply click **More info** → **Run anyway**.

---

## 3. Pre-Flight Testing Checklist

### Android Tester Verification:
- [ ] **Offline Launch**: Open airplane mode and launch app; verifies app opens without network.
- [ ] **Data Persistence**: Create a client and draft an invoice; force-close the app and reopen. Data remains intact.
- [ ] **Hardware Back Button**:
  - In Preview screen: presses back → returns to editor/dashboard.
  - In Invoice Editor: presses back → confirms before discarding unsaved edits.
  - In Settings/Subtabs: presses back → returns to dashboard.
  - On root Dashboard: presses back → cleanly exits application.
- [ ] **Soft Keyboard Behavior**: Tap into line item rate or customer notes; verify screen scrolls smoothly (`adjustResize`).
- [ ] **PDF / Print**: Tap *"Print / Save PDF"*; verifies Android Print Spooler or save-as-PDF modal appears.
- [ ] **JSON Backup**: Tap *"Export Backup"* in Settings → Data & Backup; verifies file downloads.

### Windows Tester Verification:
- [ ] **Launch & Offline**: Launches `InvoiceFlow.exe` with Wi-Fi disabled.
- [ ] **Layout Responsiveness**: Resizes window to 1280×720, 1366×768, and maximizes to 1920×1080.
- [ ] **Keyboard & Form Input**: Tab key navigates input fields; delete buttons work cleanly.
- [ ] **Data Persistence**: Data persists in `%APPDATA%/InvoiceFlow/Local Storage` across system restarts.
- [ ] **Print / PDF**: Ctrl+P or clicking *"Print / Save PDF"* opens the native Windows print preview dialog.
- [ ] **JSON Export / Import**: Downloads `invoiceflow-backup-*.json` and successfully imports it.
- [ ] **Danger Zone**: Requires explicit typing of `DELETE` to clear records.
