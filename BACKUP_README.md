# 🔄 Sideline Pinas TikTok Marketplace Auto-Backup System

This backup system automatically saves your blockchain project to your backup folder every time you make updates.

## 📁 Backup Location
Your project is automatically backed up to:
```
C:\Users\Ronirei Light\OneDrive\Desktop\LightChain_Backup_2025-07-13_23-36-57
```

## 🚀 How to Use

### Method 1: NPM Scripts (Recommended)
```bash
# Run backup using PowerShell 7
npm run backup

# Run backup using Windows PowerShell 5.1
npm run backup-win
```

### Method 2: Double-click Batch File
Simply double-click `backup.bat` in your project folder.

### Method 3: PowerShell Script
```powershell
# Navigate to project folder
cd "C:\Users\Ronirei Light\BlockChain Components\Sideline-Pinas-Complete-Project"

# Run backup script
powershell -ExecutionPolicy Bypass -File backup-script.ps1
```

### Method 4: Command Line
```bash
# From project directory
.\backup.bat
```

## 📊 What Gets Backed Up

✅ **Included:**
- All source code files (`src/`)
- Configuration files (`package.json`, `README.md`, etc.)
- Scripts and documentation
- Your TikTok marketplace implementation
- Backup scripts themselves

❌ **Excluded (for efficiency):**
- `node_modules/` folder
- `.git/` folder  
- Log files (`*.log`)
- Temporary folders (`temp/`, `tmp/`)

## 📈 Backup Summary

After each backup, you'll see a summary like this:
```
✅ Backup completed successfully!
📊 Backup Summary:
   📁 Files copied: 93,920
   💾 Total size: 962.45 MB
   📅 Backup time: 2025-07-19 17:06:01
   🎯 Location: C:\Users\Ronirei Light\OneDrive\Desktop\LightChain_Backup_2025-07-13_23-36-57

🎵 Your Sideline Pinas TikTok Marketplace is safely backed up! 🇵🇭✨
```

## 📝 Backup Log

A log file is automatically created at:
```
C:\Users\Ronirei Light\OneDrive\Desktop\LightChain_Backup_2025-07-13_23-36-57\backup-log.txt
```

This tracks:
- Backup timestamp
- Number of files copied
- Total size
- Success/failure status

## 🔄 When to Run Backups

**Recommended times to backup:**
- ✅ After adding new features
- ✅ After fixing bugs
- ✅ Before major changes
- ✅ After updating the TikTok marketplace
- ✅ After modifying the 10% platform commission system
- ✅ Before testing new functionality

## 🛠️ Troubleshooting

### PowerShell Execution Policy Error
If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Permission Issues
- Make sure OneDrive has sync permissions
- Run PowerShell as Administrator if needed
- Check that source and destination folders exist

### Large File Warning
The backup includes all project files and can be quite large (900+ MB). Ensure you have enough disk space.

## 🎵 Features Backed Up

Your backup includes all these TikTok marketplace features:
- 🎭 Content Creator Profiles
- 🎬 Short-form Video Content System  
- 💰 Multi-tier Affiliate Program (8-15% commissions)
- 🏢 **10% Sideline Pinas Platform Commission**
- 👥 Social Features (Follow, Like, Share)
- 🏆 Viral Challenge System
- 📊 Real-time Analytics Dashboard
- 🔗 Affiliate Link Tracking & Payouts
- 🪙 VERI Token Rewards System
- 🎯 Trending Algorithm
- 🌐 RESTful API Server

## 💡 Pro Tips

1. **Regular Backups**: Run backup after each development session
2. **Check Log**: Monitor `backup-log.txt` for backup history  
3. **Verify Size**: Large size differences might indicate missing exclusions
4. **OneDrive Sync**: Ensure OneDrive is syncing properly for cloud backup

---

**Your Sideline Pinas TikTok Marketplace with 10% Platform Commission is now automatically backed up! 🎵💰🇵🇭**
