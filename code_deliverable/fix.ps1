$indexPath = "index.html"
$jsPath = "scripts.js"
$cssPath = "styles.css"

$content = Get-Content -Raw -Path $indexPath

# Extract JS
$startIndex = $content.IndexOf('<script type="module">') + '<script type="module">'.Length
$endIndex = $content.IndexOf('</script>', $startIndex)
$jsContent = $content.Substring($startIndex, $endIndex - $startIndex)
Set-Content -Path $jsPath -Value $jsContent

# Extract CSS
$startIndex = $content.IndexOf('<style>') + '<style>'.Length
$endIndex = $content.IndexOf('</style>', $startIndex)
$cssContent = $content.Substring($startIndex, $endIndex - $startIndex)
Set-Content -Path $cssPath -Value $cssContent

# Modify HTML
$scriptBlockStartIndex = $content.IndexOf('<script type="module">')
$scriptBlockEndIndex = $content.IndexOf('</script>', $scriptBlockStartIndex) + '</script>'.Length
$scriptBlock = $content.Substring($scriptBlockStartIndex, $scriptBlockEndIndex - $scriptBlockStartIndex)
$newContent = $content.Replace($scriptBlock, '<script type="module" src="scripts.js"></script>')

$styleBlockStartIndex = $newContent.IndexOf('<style>')
$styleBlockEndIndex = $newContent.IndexOf('</style>', $styleBlockStartIndex) + '</style>'.Length
$styleBlock = $newContent.Substring($styleBlockStartIndex, $styleBlockEndIndex - $styleBlockStartIndex)
$finalContent = $newContent.Replace($styleBlock, '<link rel="stylesheet" href="styles.css" />')

Set-Content -Path $indexPath -Value $finalContent
