# Records BluDoku's enthusiastic voice clips with Windows text-to-speech.
#   powershell -ExecutionPolicy Bypass -File scripts/make-voices.ps1
# Then trim the silence: node scripts/trim-sounds.mjs
Add-Type -AssemblyName System.Speech

$lines = [ordered]@{
  # Finding a cat: enthusiasm builds as more cats are found.
  "find-1a" = "Nice!"
  "find-1b" = "Yes!"
  "find-1c" = "Ooh!"
  "find-1d" = "Good one!"
  "find-2a" = "Wow!"
  "find-2b" = "Amazing!"
  "find-2c" = "Fantastic!"
  "find-2d" = "Brilliant!"
  "find-3a" = "Incredible!"
  "find-3b" = "Unbelievable!"
  "find-3c" = "Spectacular!"
  "find-3d" = "Phenomenal!"
  # Winning.
  "win-a" = "You did it! Absolutely incredible!"
  "win-b" = "Oh my gosh! You are a genius!"
  "win-c" = "Purr fect! Simply legendary!"
  "win-d" = "Wow, wow, wow! You are amazing!"
}

$out = Join-Path $PSScriptRoot "..\public\sounds"
$format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)

foreach ($key in $lines.Keys) {
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $synth.SelectVoice("Microsoft Zira Desktop")
  $synth.SetOutputToWaveFile((Join-Path $out "$key.wav"), $format)
  $text = [System.Security.SecurityElement]::Escape($lines[$key])
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><prosody volume='x-loud'>$text</prosody></speak>"
  $synth.SpeakSsml($ssml)
  $synth.Dispose()
  Write-Output "recorded $key"
}
