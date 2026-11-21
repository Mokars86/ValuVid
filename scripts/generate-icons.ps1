[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null

$masterPath = 'resources\icon_master_1024.png'
$master = [System.Drawing.Image]::FromFile($masterPath)
$bgColor = [System.Drawing.Color]::FromArgb(255, 8, 41, 73)

function Resize-Image($img, $w, $h) {
    $dest = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $brush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($brush, 0, 0, $w, $h)
    $g.DrawImage($img, 0, 0, $w, $h)
    $brush.Dispose()
    $g.Dispose()
    return $dest
}

function Create-RoundImage($img, $size) {
    $dest = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $g.SetClip($path)
    
    $brush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $g.DrawImage($img, 0, 0, $size, $size)
    
    $brush.Dispose()
    $path.Dispose()
    $g.Dispose()
    return $dest
}

$densities = @{
    'mdpi' = @{ 'icon' = 48; 'fg' = 108 };
    'hdpi' = @{ 'icon' = 72; 'fg' = 162 };
    'xhdpi' = @{ 'icon' = 96; 'fg' = 216 };
    'xxhdpi' = @{ 'icon' = 144; 'fg' = 324 };
    'xxxhdpi' = @{ 'icon' = 192; 'fg' = 432 }
}

foreach ($d in $densities.Keys) {
    $folder = "android\app\src\main\res\mipmap-$d"
    $iconSize = $densities[$d]['icon']
    $fgSize = $densities[$d]['fg']
    
    $square = Resize-Image $master $iconSize $iconSize
    $square.Save("$folder\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $square.Dispose()
    
    $round = Create-RoundImage $master $iconSize
    $round.Save("$folder\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $round.Dispose()
    
    $fg = Resize-Image $master $fgSize $fgSize
    $fg.Save("$folder\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $fg.Dispose()
    
    Write-Output "Updated mipmap-$d (icon: $iconSize x $iconSize, fg: $fgSize x $fgSize)"
}

# Update web app-icon.jpg (leaving public\logo.png intact for splash screen)
$web512 = Resize-Image $master 512 512
$web512.Save("public\app-icon.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$web512.Dispose()
Write-Output "Updated public\app-icon.jpg"

# Generate Splash screens
$splashSizes = @{
    'drawable\splash.png' = @(480, 320);
    'drawable-port-mdpi\splash.png' = @(320, 480);
    'drawable-port-hdpi\splash.png' = @(480, 800);
    'drawable-port-xhdpi\splash.png' = @(720, 1280);
    'drawable-port-xxhdpi\splash.png' = @(960, 1600);
    'drawable-port-xxxhdpi\splash.png' = @(1280, 1920);
    'drawable-land-mdpi\splash.png' = @(480, 320);
    'drawable-land-hdpi\splash.png' = @(800, 480);
    'drawable-land-xhdpi\splash.png' = @(1280, 720);
    'drawable-land-xxhdpi\splash.png' = @(1600, 960);
    'drawable-land-xxxhdpi\splash.png' = @(1920, 1280);
}

foreach ($relPath in $splashSizes.Keys) {
    $sw = $splashSizes[$relPath][0]
    $sh = $splashSizes[$relPath][1]
    $fullPath = "android\app\src\main\res\$relPath"
    
    $splashBmp = New-Object System.Drawing.Bitmap($sw, $sh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($splashBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $brush = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($brush, 0, 0, $sw, $sh)
    $brush.Dispose()
    
    # Scale emblem to ~42% of smallest dimension
    $logoDim = [int]([Math]::Min($sw, $sh) * 0.42)
    $lx = [int](($sw - $logoDim) / 2)
    $ly = [int](($sh - $logoDim) / 2)
    $g.DrawImage($master, $lx, $ly, $logoDim, $logoDim)
    $g.Dispose()
    
    $splashBmp.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $splashBmp.Dispose()
    Write-Output "Updated splash: $relPath ($sw x $sh)"
}

$master.Dispose()
Write-Output "All icons and splash screens successfully updated!"
