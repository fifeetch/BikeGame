param([string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$mapPath = Join-Path $Root 'dist/assets/europe/nouvelle-carte.png'
$sourcePath = Join-Path $Root 'dist/assets/europe/board-data.js'
$europePath = Join-Path $Root 'dist/europe.js'
$bitmap = [System.Drawing.Bitmap]::new($mapPath)

function Get-TerrainVotes([double]$x, [double]$y, [double[]]$rings) {
    $votes = @{ mer = 0; cote = 0; plaine = 0; moyenne_montagne = 0; montagne = 0 }
    foreach ($ring in $rings) {
        for ($i = 0; $i -lt 12; $i++) {
            $angle = $i * [Math]::PI / 6
            $px = [int][Math]::Round($x + $ring * [Math]::Cos($angle))
            $py = [int][Math]::Round($y + $ring * [Math]::Sin($angle))
            if ($px -lt 0 -or $py -lt 0 -or $px -ge $script:bitmap.Width -or $py -ge $script:bitmap.Height) { continue }
            $color = $script:bitmap.GetPixel($px, $py); $red = [int]$color.R; $green = [int]$color.G; $blue = [int]$color.B
            if ($blue -gt 220 -and $green -gt 218 -and $red -gt 150 -and ($blue - $red) -lt 100) { $votes.mer++; continue }
            if ($blue -gt ($green + 12) -and $blue -gt ($red + 55) -and $green -gt 110 -and $red -lt 145) { $votes.cote++; continue }
            if ($green -gt ($red + 3) -and $green -gt ($blue + 18) -and $red -gt 85 -and $blue -lt 175) { $votes.plaine++; continue }
            if ($red -gt ($green + 5) -and $green -gt ($blue + 12) -and $red -gt 145 -and $blue -lt 175) { $votes.moyenne_montagne++; continue }
            $max = [Math]::Max($red, [Math]::Max($green, $blue)); $min = [Math]::Min($red, [Math]::Min($green, $blue))
            if (($max - $min) -lt 45 -and $min -gt 55 -and $max -lt 210) { $votes.montagne++ }
        }
    }
    $landVotes = $votes.cote + $votes.plaine + $votes.moyenne_montagne + $votes.montagne
    if ($votes.mer -gt $landVotes) { return 'mer' }
    if ($votes.cote -gt 0 -and $votes.cote -ge [Math]::Max($votes.plaine, [Math]::Max($votes.moyenne_montagne, $votes.montagne))) { return 'cote' }
    $type = 'plaine'; $best = $votes.plaine
    foreach ($candidate in @('moyenne_montagne', 'montagne')) { if ($votes[$candidate] -gt $best) { $type = $candidate; $best = $votes[$candidate] } }
    if ($landVotes -eq 0) { return 'mer' }
    return $type
}

try {
    $europeSource = Get-Content -LiteralPath $europePath -Raw
    $anchorBlock = [regex]::Match($europeSource, 'export const CITY_ANCHORS=(\{.*?\});', 'Singleline').Groups[1].Value
    $anchors = @([regex]::Matches($anchorBlock, "(?:'(?<quoted>[^']+)'|(?<plain>[\p{L}-]+)):\[(?<x>\d+),(?<y>\d+)\]") | ForEach-Object {
        [pscustomobject]@{ Name = $(if ($_.Groups['quoted'].Success) { $_.Groups['quoted'].Value } else { $_.Groups['plain'].Value }); X = [double]$_.Groups['x'].Value; Y = [double]$_.Groups['y'].Value }
    })

    $width = 1261; $height = 842; $originX = 630; $originY = 50
    $coarseSpacing = 29.0; $coarseRadius = $coarseSpacing / [Math]::Sqrt(3); $coarseRow = 1.5 * $coarseRadius
    $coarse = @{}; $coarseQMin = 1000; $coarseQMax = -1000; $coarseRMin = 1000; $coarseRMax = -1000
    for ($r = -2; $r -le 40; $r++) {
        $y = $originY + $coarseRow * $r
        if ($y -lt 0 -or $y -gt $height) { continue }
        for ($q = -40; $q -le 40; $q++) {
            $x = $originX + $coarseSpacing * $q - ($coarseSpacing / 2) * $r
            if ($x -lt 0 -or $x -gt $width) { continue }
            $coarse["$q,$r"] = Get-TerrainVotes $x $y @(2.5, 4.5, 6.5)
            $coarseQMin = [Math]::Min($coarseQMin, $q); $coarseQMax = [Math]::Max($coarseQMax, $q)
            $coarseRMin = [Math]::Min($coarseRMin, $r); $coarseRMax = [Math]::Max($coarseRMax, $r)
        }
    }

    $spacing = 29 / [Math]::Sqrt(2); $radius = $spacing / [Math]::Sqrt(3); $rowStep = 1.5 * $radius
    $cells = [System.Collections.Generic.List[object]]::new()
    for ($r = -2; $r -le 60; $r++) {
        $y = $originY + $rowStep * $r
        if ($y -lt $radius -or $y -gt $height - $radius) { continue }
        for ($q = -80; $q -le 80; $q++) {
            $x = $originX + $spacing * $q - ($spacing / 2) * $r
            if ($x -lt $spacing / 2 -or $x -gt $width - $spacing / 2) { continue }
            $r0 = [int][Math]::Round(($y - $originY) / $coarseRow)
            $q0 = [int][Math]::Round(($x - $originX + ($coarseSpacing / 2) * $r0) / $coarseSpacing)
            $bestKey = $null; $bestDistance = [double]::PositiveInfinity
            for ($dr = -1; $dr -le 1; $dr++) { for ($dq = -1; $dq -le 1; $dq++) {
                $key = "$($q0 + $dq),$($r0 + $dr)"; if (-not $coarse.ContainsKey($key)) { continue }
                $cx = $originX + $coarseSpacing * ($q0 + $dq) - ($coarseSpacing / 2) * ($r0 + $dr)
                $cy = $originY + $coarseRow * ($r0 + $dr)
                $distance = [Math]::Pow($cx - $x, 2) + [Math]::Pow($cy - $y, 2)
                if ($distance -lt $bestDistance) { $bestKey = $key; $bestDistance = $distance }
            }}
            $type = if ($bestKey) { $coarse[$bestKey] } else { 'mer' }
            $cells.Add([pscustomobject]@{ q = $q; r = $r; x = [Math]::Round($x, 3); y = [Math]::Round($y, 3); type = $type; name = '' })
        }
    }

    foreach ($city in $anchors) {
        $chosen = $null; $bestDistance = [double]::PositiveInfinity
        foreach ($cell in $cells) {
            if ($cell.name -or $cell.type -eq 'mer') { continue }
            $distance = [Math]::Pow($cell.x - $city.X, 2) + [Math]::Pow($cell.y - $city.Y, 2)
            if ($distance -lt $bestDistance) { $chosen = $cell; $bestDistance = $distance }
        }
        if (-not $chosen) { throw "Impossible de placer la ville $($city.Name)." }
        $chosen.type = 'ville'; $chosen.name = $city.Name
    }

    $byAxial = @{}
    foreach ($cell in $cells) { $byAxial["$($cell.q),$($cell.r)"] = $cell }
    $directions = @(@(1,0), @(1,1), @(0,1), @(-1,0), @(-1,-1), @(0,-1))
    foreach ($cell in $cells) {
        if ($cell.type -eq 'mer' -or $cell.name) { continue }
        foreach ($direction in $directions) {
            $neighbor = $byAxial["$($cell.q + $direction[0]),$($cell.r + $direction[1])"]
            if ($neighbor -and $neighbor.type -eq 'mer') { $cell.type = 'cote'; break }
        }
    }

    $output = 'export const MAP_CELLS=' + (ConvertTo-Json -InputObject @($cells) -Depth 5 -Compress) + ";`n"
    [System.IO.File]::WriteAllText($sourcePath, $output, [System.Text.UTF8Encoding]::new($false))
    $seaCount = @($cells | Where-Object type -eq 'mer').Count
    Write-Output "Grille régulière : $($cells.Count) hexagones, $seaCount mer, $($anchors.Count) villes."
}
finally { $bitmap.Dispose() }
