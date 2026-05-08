Add-Type -AssemblyName System.Drawing

$width = 1600
$height = 900
$out = Join-Path $PSScriptRoot 'rgb-mosaic-poster.png'

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

function Brush($hex) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function Pen($hex, $size = 1) {
  return New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($hex)), $size
}

function FillRect($hex, $x, $y, $w, $h) {
  $graphics.FillRectangle((Brush $hex), $x, $y, $w, $h)
}

function StrokeRect($hex, $x, $y, $w, $h, $size = 1) {
  $graphics.DrawRectangle((Pen $hex $size), $x, $y, $w, $h)
}

function DrawText($text, $fontName, $size, $style, $hex, $x, $y) {
  $fontStyle = [System.Drawing.FontStyle]::$style
  $font = New-Object System.Drawing.Font $fontName, $size, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel
  $graphics.DrawString($text, $font, (Brush $hex), $x, $y)
}

FillRect '#070605' 0 0 $width $height

$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle 0, 0, $width, $height),
  ([System.Drawing.ColorTranslator]::FromHtml('#16110b')),
  ([System.Drawing.ColorTranslator]::FromHtml('#050505')),
  25
)
$graphics.FillRectangle($bgBrush, 0, 0, $width, $height)

for ($x = 0; $x -lt $width; $x += 32) {
  $graphics.DrawLine((Pen '#191611' 1), $x, 0, $x, $height)
}
for ($y = 0; $y -lt $height; $y += 32) {
  $graphics.DrawLine((Pen '#191611' 1), 0, $y, $width, $y)
}

$rand = New-Object System.Random 27
for ($i = 0; $i -lt 860; $i++) {
  $x = $rand.Next(0, $width)
  $y = $rand.Next(0, $height)
  $alpha = $rand.Next(14, 42)
  $c = [System.Drawing.Color]::FromArgb($alpha, 245, 241, 223)
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush $c), $x, $y, 1, 1)
}

for ($i = 0; $i -lt 72; $i++) {
  $x = 132 + ($i * 18)
  $heightLine = 70 + [Math]::Sin($i * 0.38) * 34 + ($i % 7) * 7
  $color = if ($i % 3 -eq 0) { '#ff2b5f' } elseif ($i % 3 -eq 1) { '#47ff6a' } else { '#00d9ff' }
  FillRect $color $x (700 - $heightLine) 7 $heightLine
}

$panel = [System.Drawing.Color]::FromArgb(188, 8, 8, 7)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush $panel), 86, 78, 1428, 744)
StrokeRect '#3a3325' 86 78 1428 744 2
StrokeRect '#f5d36a' 116 108 1368 684 1

for ($i = 0; $i -lt 130; $i++) {
  $x = 112 + $rand.Next(0, 1370)
  $y = 106 + $rand.Next(0, 690)
  $s = $rand.Next(4, 18)
  $color = if ($i % 3 -eq 0) { '#ff2b5f' } elseif ($i % 3 -eq 1) { '#47ff6a' } else { '#00d9ff' }
  $a = [System.Drawing.ColorTranslator]::FromHtml($color)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, $a.R, $a.G, $a.B))
  $graphics.FillRectangle($brush, $x, $y, $s, $s)
}

$cell = 26
$gridX = 978
$gridY = 170
for ($row = 0; $row -lt 16; $row++) {
  for ($col = 0; $col -lt 16; $col++) {
    $x = $gridX + ($col * $cell)
    $y = $gridY + ($row * $cell)
    $pick = ($row * 17 + $col * 11) % 13
    if ($pick -eq 0) { $fill = '#ff2b5f' }
    elseif ($pick -eq 1) { $fill = '#47ff6a' }
    elseif ($pick -eq 2) { $fill = '#00d9ff' }
    elseif ($pick -eq 3) { $fill = '#ffcc4d' }
    else { $fill = '#141414' }
    FillRect $fill $x $y ($cell - 3) ($cell - 3)
  }
}
StrokeRect '#f5f1df' ($gridX - 16) ($gridY - 16) (($cell * 16) + 29) (($cell * 16) + 29) 2
StrokeRect '#00d9ff' ($gridX - 28) ($gridY - 28) (($cell * 16) + 53) (($cell * 16) + 53) 1

$coreX = 205
$coreY = 174
for ($ring = 0; $ring -lt 10; $ring++) {
  $size = 470 - ($ring * 36)
  $x = $coreX + ($ring * 18)
  $y = $coreY + ($ring * 18)
  $color = if ($ring % 3 -eq 0) { '#ff2b5f' } elseif ($ring % 3 -eq 1) { '#47ff6a' } else { '#00d9ff' }
  StrokeRect $color $x $y $size $size 2
}

for ($i = 0; $i -lt 34; $i++) {
  $x = 232 + (($i * 61) % 420)
  $y = 202 + (($i * 97) % 420)
  $s = 24 + (($i * 7) % 42)
  $color = if ($i % 3 -eq 0) { '#ff2b5f' } elseif ($i % 3 -eq 1) { '#47ff6a' } else { '#00d9ff' }
  FillRect $color $x $y $s $s
  StrokeRect '#050505' $x $y $s $s 2
}

$beamPenR = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(190, 255, 43, 95)), 3
$beamPenG = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(170, 71, 255, 106)), 3
$beamPenB = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(190, 0, 217, 255)), 3
$graphics.DrawBezier($beamPenR, 600, 320, 760, 210, 850, 260, 966, 232)
$graphics.DrawBezier($beamPenG, 600, 390, 760, 370, 820, 520, 966, 438)
$graphics.DrawBezier($beamPenB, 600, 470, 760, 560, 860, 620, 966, 555)

DrawText 'RGB 马赛克矿场' 'Microsoft YaHei UI' 74 Bold '#f5f1df' 168 612
DrawText 'MINE COLOR. PAINT ASSETS.' 'Consolas' 28 Regular '#ffcc4d' 174 706
DrawText '16x16 / RGB / UNIQUE ASSET' 'Consolas' 22 Regular '#00d9ff' 984 640
DrawText 'STEAM-READY PIXEL ASSET PROTOTYPE' 'Consolas' 18 Regular '#b8af9b' 984 680
DrawText 'PIXEL_HASH :: CANVAS + ORDERED_RGB_MATRIX' 'Consolas' 15 Regular '#766f62' 984 716

DrawText 'R' 'Consolas' 18 Bold '#ff2b5f' 1370 150
DrawText 'G' 'Consolas' 18 Bold '#47ff6a' 1408 150
DrawText 'B' 'Consolas' 18 Bold '#00d9ff' 1446 150

for ($i = 0; $i -lt 18; $i++) {
  $x = 146 + ($i * 38)
  StrokeRect '#3a3325' $x 132 22 22 1
}
for ($i = 0; $i -lt 12; $i++) {
  $marker = '{0:X2}' -f ($i * 19)
  $markerX = 142 + ($i * 92)
  DrawText $marker 'Consolas' 13 Regular '#5f584c' $markerX 802
}

$bitmap.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
