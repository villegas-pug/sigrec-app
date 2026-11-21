$ErrorActionPreference = 'Stop'
$frontendDir = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$jobsPath = Join-Path $frontendDir 'artifacts/manual-usuario/clean/voice-jobs.json'
Add-Type -AssemblyName System.Speech
$manualSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$manualSynth.SelectVoice('Microsoft Sabina Desktop')
$manualSynth.Rate = 2
$manualFormat = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$manualJobs = Get-Content -LiteralPath $jobsPath -Raw | ConvertFrom-Json
foreach ($manualJob in $manualJobs) {
    if ($manualJob.reuse -and (Test-Path -LiteralPath $manualJob.reuse)) {
        Copy-Item -LiteralPath $manualJob.reuse -Destination $manualJob.path -Force
    } else {
        $manualSynth.SetOutputToWaveFile($manualJob.path, $manualFormat)
        $manualSynth.Speak($manualJob.text)
        $manualSynth.SetOutputToNull()
    }
}
$manualSynth.Dispose()
