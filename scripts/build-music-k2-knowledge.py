import json, re, unicodedata
from pathlib import Path

OUT = Path('src/brains/music-sensor/data/music-k2-general.json')
OUT.parent.mkdir(parents=True, exist_ok=True)
concepts=[]; seen=set()

def slug(s):
    s=s.replace('Đ','D').replace('đ','d')
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')[:100]

def add(domain, kind, label, parent=None, aliases=None, related=None, props=None, semantic=None, desc=None):
    cid=f'{domain}:{slug(label)}'
    if cid in seen: return cid
    seen.add(cid)
    concepts.append({
      'id':cid,'domain':domain,'kind':kind,'label':label,
      'aliases':aliases or [],'parents':[parent] if parent else [],'related':related or [],
      'description':desc or f'{label} is a {kind.replace("-"," ")} concept in the {domain} domain of music knowledge.',
      'properties':props or {}, **({'semantic':semantic} if semantic else {})
    })
    return cid

def root(domain,label): return add(domain,'domain',label,desc=f'{label} knowledge domain.')
def group(domain,label,kind,terms,parent=None):
    gid=add(domain,'category',label,parent=parent,desc=f'{label}: structured {domain} concepts used by Sentinel Music.')
    for raw in terms.split('|'):
      raw=raw.strip()
      if not raw: continue
      parts=[x.strip() for x in raw.split('::')]
      name=parts[0]; aliases=[] if len(parts)<2 else [x.strip() for x in parts[1].split(',') if x.strip()]
      add(domain,kind,name,parent=gid,aliases=aliases)
    return gid

def sgroup(family,kind,terms,parent=None):
    gid=add('genre','category',family,parent=parent,desc=f'{family} genre/style family.')
    for raw in terms.split('|'):
      raw=raw.strip()
      if not raw: continue
      parts=[x.strip() for x in raw.split('::')]
      name=parts[0]; aliases=[] if len(parts)<2 else [x.strip() for x in parts[1].split(',') if x.strip()]
      semkind='genre' if kind=='genre' else 'style'
      add('genre',kind,name,parent=gid,aliases=aliases,semantic={'kind':semkind,'family':family})
    return gid

roots={d:root(d,l) for d,l in {
 'theory':'Music theory','rhythm':'Rhythm and meter','form':'Musical form','instrument':'Instruments and ensembles',
 'vocal':'Voice and vocal technique','production':'Recording and production','audio':'Audio and psychoacoustics',
 'history':'Music history','recording':'Recording and work identity','world':'World and regional music','genre':'Genre and style taxonomy'
}.items()}

# THEORY
group('theory','Pitch and notation','concept','''pitch|frequency|note|pitch class|octave|register|concert pitch|A440|enharmonic equivalence|accidental|sharp|flat|natural|double sharp|double flat|staff|clef|treble clef|bass clef|alto clef|tenor clef|ledger line|key signature|time signature|barline|measure|rest|note value|whole note|half note|quarter note|eighth note|sixteenth note|thirty-second note|dotted note|tie|slur|articulation|dynamic marking|tempo marking|repeat sign|coda|segno|ferm ata::fermata'''.replace('ferm ata','fermata'),roots['theory'])
group('theory','Intervals','interval','''unison|minor second|major second|minor third|major third|perfect fourth|augmented fourth|diminished fifth|tritone|perfect fifth|minor sixth|major sixth|minor seventh|major seventh|octave|minor ninth|major ninth|perfect eleventh|major thirteenth|compound interval|simple interval|consonance|dissonance|interval inversion''',roots['theory'])
group('theory','Scales and modes','scale','''major scale|natural minor scale|harmonic minor scale|melodic minor scale|chromatic scale|whole-tone scale|major pentatonic|minor pentatonic|blues scale|octatonic scale|diminished scale|augmented scale|bebop dominant scale|bebop major scale|bebop minor scale|Ionian mode|Dorian mode|Phrygian mode|Lydian mode|Mixolydian mode|Aeolian mode|Locrian mode|harmonic major|double harmonic major|Hungarian minor|Phrygian dominant|Lydian dominant|altered scale|whole-half diminished|half-whole diminished|acoustic scale|Neapolitan major|Neapolitan minor|major blues scale|minor blues scale|Hirajoshi scale|In scale|Insen scale|Iwato scale|Yo scale|Ritsu scale|Ryo scale|pelog|slendro|maqam scale concept|raga scale concept|microtonal scale|quarter-tone scale|just intonation scale''',roots['theory'])
group('theory','Chords and voicing','chord','''major triad|minor triad|diminished triad|augmented triad|suspended second chord|suspended fourth chord|power chord|major sixth chord|minor sixth chord|dominant seventh chord|major seventh chord|minor seventh chord|half-diminished seventh chord|diminished seventh chord|minor-major seventh chord|augmented major seventh chord|dominant ninth chord|major ninth chord|minor ninth chord|dominant eleventh chord|major eleventh chord|minor eleventh chord|dominant thirteenth chord|major thirteenth chord|minor thirteenth chord|add9 chord|add11 chord|six-nine chord|altered dominant chord|flat-nine chord|sharp-nine chord|sharp-eleven chord|flat-thirteen chord|slash chord|polychord|quartal chord|quintal chord|tone cluster|open voicing|close voicing|drop-2 voicing|drop-3 voicing|root position|first inversion|second inversion|third inversion|upper structure triad|shell voicing|guide tones|chord extension|chord alteration''',roots['theory'])
group('theory','Harmony and tonality','concept','''tonality|atonality|key|tonic|dominant|subdominant|mediant|submediant|leading tone|subtonic|scale degree|functional harmony|nonfunctional harmony|diatonic harmony|chromatic harmony|modal harmony|tertian harmony|quartal harmony|pedal point|drone|ostinato|harmonic rhythm|voice leading|contrary motion|parallel motion|oblique motion|similar motion|common tone|doubling|open fifth|secondary dominant|secondary leading-tone chord|applied chord|borrowed chord|modal mixture|Neapolitan chord|Italian augmented sixth|French augmented sixth|German augmented sixth|tritone substitution|backdoor dominant|turnaround|ii-V-I|I-V-vi-IV|circle progression|circle of fifths|circle of fourths|cadence|authentic cadence|perfect authentic cadence|imperfect authentic cadence|plagal cadence|half cadence|deceptive cadence|Phrygian cadence|modulation|pivot-chord modulation|direct modulation|common-tone modulation|chromatic mediant|tonicization|re-harmonization|harmonic substitution|negative harmony|planing|parallel harmony|polytonality|bitonality|pandiatonicism|serialism|twelve-tone technique|set theory|pitch-class set|tone row''',roots['theory'])
group('theory','Melody and counterpoint','concept','''melody|motif|motive|theme|phrase|period|sentence form|antecedent phrase|consequent phrase|sequence|melodic contour|stepwise motion|conjunct motion|disjunct motion|leap|ornament|grace note|trill|mordent|turn ornament|appoggiatura|acciaccatura|passing tone|neighbor tone|suspension|retardation|anticipation|escape tone|cambiata|counterpoint|species counterpoint|first species counterpoint|second species counterpoint|third species counterpoint|fourth species counterpoint|fifth species counterpoint|imitation|canon|round|fugue|subject|answer|countersubject|stretto|augmentation|diminution|invertible counterpoint|contrapuntal inversion''',roots['theory'])
group('theory','Tuning and temperament','concept','''tuning|temperament|equal temperament|12-TET|just intonation|Pythagorean tuning|meantone temperament|well temperament|Werckmeister temperament|Kirnberger temperament|microtonality|cent|comma|Pythagorean comma|syntonic comma|harmonic series|overtone series|fundamental frequency|partial|inharmonicity|resonance|sympathetic resonance''',roots['theory'])

# Practical harmonic vocabulary: concrete chord/scale spellings are useful for parsing metadata,
# annotations and future harmonic inference, not just abstract theory definitions.
ROOTS=[('C',['C']),('C sharp / D flat',['C#','Db']),('D',['D']),('D sharp / E flat',['D#','Eb']),('E',['E']),('F',['F']),('F sharp / G flat',['F#','Gb']),('G',['G']),('G sharp / A flat',['G#','Ab']),('A',['A']),('A sharp / B flat',['A#','Bb']),('B',['B'])]
CHORDS=[
 ('major triad',['maj'],'major triad'),('minor triad',['m','min'],'minor triad'),('diminished triad',['dim','°'],'diminished triad'),
 ('augmented triad',['aug','+'],'augmented triad'),('suspended second chord',['sus2'],'suspended second chord'),
 ('suspended fourth chord',['sus4'],'suspended fourth chord'),('power chord',['5'],'power chord'),('major sixth chord',['6'],'major sixth chord'),
 ('minor sixth chord',['m6'],'minor sixth chord'),('dominant seventh chord',['7'],'dominant seventh chord'),
 ('major seventh chord',['maj7','M7'],'major seventh chord'),('minor seventh chord',['m7','min7'],'minor seventh chord'),
 ('half-diminished seventh chord',['m7b5','ø7'],'half-diminished seventh chord'),('diminished seventh chord',['dim7','°7'],'diminished seventh chord'),
 ('minor-major seventh chord',['mMaj7'],'minor-major seventh chord'),('dominant ninth chord',['9'],'dominant ninth chord'),
 ('major ninth chord',['maj9'],'major ninth chord'),('minor ninth chord',['m9'],'minor ninth chord'),('dominant eleventh chord',['11'],'dominant eleventh chord'),
 ('minor eleventh chord',['m11'],'minor eleventh chord'),('dominant thirteenth chord',['13'],'dominant thirteenth chord'),
 ('minor thirteenth chord',['m13'],'minor thirteenth chord'),('add9 chord',['add9'],'add9 chord'),('six-nine chord',['6/9'],'six-nine chord'),
 ('flat-nine dominant',['7b9'],'flat-nine chord'),('sharp-nine dominant',['7#9'],'sharp-nine chord'),
 ('sharp-eleven dominant',['7#11'],'sharp-eleven chord'),('flat-thirteen dominant',['7b13'],'flat-thirteen chord')]
for root_name, root_aliases in ROOTS:
  for quality, symbols, relation_label in CHORDS:
    aliases=[]
    for ra in root_aliases:
      aliases += [f'{ra}{symbol}' for symbol in symbols]
      aliases.append(f'{ra} {quality}')
    add('theory','chord-instance',f'{root_name} {quality}',parent='theory:chords-and-voicing',aliases=aliases,
        related=[f'theory:{slug(relation_label)}'],props={'root':root_name,'quality':quality})
SCALES=[('major scale','major scale'),('natural minor scale','natural minor scale'),('harmonic minor scale','harmonic minor scale'),
 ('melodic minor scale','melodic minor scale'),('Dorian mode','dorian mode'),('Phrygian mode','phrygian mode'),('Lydian mode','lydian mode'),
 ('Mixolydian mode','mixolydian mode'),('Aeolian mode','aeolian mode'),('Locrian mode','locrian mode'),
 ('major pentatonic','major pentatonic'),('minor pentatonic','minor pentatonic'),('blues scale','blues scale')]
for root_name, root_aliases in ROOTS:
  for scale_name, relation_label in SCALES:
    aliases=[f'{ra} {scale_name}' for ra in root_aliases]
    add('theory','scale-instance',f'{root_name} {scale_name}',parent='theory:scales-and-modes',aliases=aliases,
        related=[f'theory:{slug(relation_label)}'],props={'tonic':root_name,'scale':scale_name})

# RHYTHM
group('rhythm','Pulse tempo and subdivision','concept','''pulse|beat|tempo|BPM|subdivision|duple subdivision|triple subdivision|straight feel|swung feel|swing ratio|rubato|accelerando|ritardando|rallentando|a tempo|metric modulation|tempo rubato|double time|half time|double-time feel|half-time feel|free time|isochronous pulse''',roots['rhythm'])
group('rhythm','Meter','meter','''simple duple meter|simple triple meter|simple quadruple meter|compound duple meter|compound triple meter|compound quadruple meter|2/4 meter|3/4 meter|4/4 meter|5/4 meter|6/8 meter|7/8 meter|9/8 meter|12/8 meter|mixed meter|additive meter|asymmetrical meter|odd meter|polymeter|metric ambiguity|hemiola''',roots['rhythm'])
group('rhythm','Rhythmic devices','concept','''syncopation|offbeat|backbeat|downbeat|upbeat|anacrusis|pickup note|cross-rhythm|polyrhythm|3:2 polyrhythm|2:3 polyrhythm|4:3 polyrhythm|clave|tresillo|cinquillo|euclidean rhythm|ostinato rhythm|rhythmic motif|tuplet|triplet|quintuplet|sextuplet|septuplet|dotted rhythm|Scotch snap|anticipation rhythm|push rhythm|drag|laid-back feel|ahead-of-the-beat feel|groove|pocket|shuffle|boogie rhythm|swing rhythm|four-on-the-floor|breakbeat|amen break|two-step rhythm|dembow|reggaeton dembow|bossa nova clave|son clave|rumba clave|samba groove|baiao groove|funk sixteenth groove|disco groove|rock backbeat|blast beat|double-kick pattern|train beat|waltz accompaniment|oom-pah|Alberti bass rhythm''',roots['rhythm'])

# FORM
group('form','Classical and art forms','form','''binary form|rounded binary form|ternary form|compound ternary form|rondo|sonata form|sonata-rondo form|theme and variations|variation form|minuet and trio|scherzo and trio|concerto form|ritornello form|fugue form|passacaglia|chaconne|ground bass|through-composed form|strophic form|da capo aria|recitative|aria|arioso|cantata|oratorio|mass|requiem|suite|symphony|sonata|concerto|concerto grosso|string quartet|tone poem|symphonic poem|overture|prelude|intermezzo|etude|nocturne|impromptu|rhapsody|fantasia|toccata|ballade|serenade|divertimento|capriccio|bagatelle''',roots['form'])
group('form','Popular song forms','form','''verse|chorus|pre-chorus|post-chorus|bridge|intro|outro|refrain|hook|breakdown|build-up|drop|instrumental break|solo section|verse-chorus form|AABA form|ABAB form|ABAC form|12-bar blues|8-bar blues|16-bar blues|32-bar song form|through-composed song|loop-based form|vamp-based form|call and response|medley|mashup form|DJ extended mix form|radio edit form|dance build-drop form|hip-hop verse-hook form''',roots['form'])

# INSTRUMENTS
group('instrument','Bowed strings','instrument','''violin|viola|cello|double bass|contrabass|viola da gamba|viol|rebec|hardanger fiddle|nyckelharpa|erhu|zhonghu|gaohu|jinghu|banhu|morin khuur|sarangi|sarinda|esraj|dilruba|gadulka|gudok|kamancheh|rebab|rabab|lyra|pontic lyra''',roots['instrument'])
group('instrument','Plucked strings','instrument','''acoustic guitar|classical guitar|steel-string guitar|electric guitar|12-string guitar|bass guitar|fretless bass|harp|concert harp|Celtic harp|lyre|lute|theorbo|mandolin|mandola|mandocello|banjo|ukulele|oud|saz|baglama|bouzouki|balalaika|domra|sitar|sarod|tanpura|veena|rudra veena|koto|shamisen|biwa|pipa|ruan|sanxian|guzheng|gayageum|geomungo|đàn tranh::dan tranh|đàn nguyệt::dan nguyet|đàn tỳ bà::dan ty ba|đàn đáy::dan day|đàn bầu::dan bau|đàn sến::dan sen|đàn tính::dan tinh''',roots['instrument'])
group('instrument','Woodwinds','instrument','''flute|piccolo|alto flute|bass flute|recorder|tin whistle|Irish flute|pan flute|ocarina|shakuhachi|dizi|xiao|bansuri|ney|quena|oboe|English horn|oboe d amore|bassoon|contrabassoon|clarinet|bass clarinet|contrabass clarinet|soprano saxophone|alto saxophone|tenor saxophone|baritone saxophone|sopranino saxophone|bass saxophone|harmonica|melodica|sheng|khene|suona|zurna|duduk|hulusi|đàn k'lông pút::klong put''',roots['instrument'])
group('instrument','Brass','instrument','''trumpet|cornet|flugelhorn|piccolo trumpet|trombone|bass trombone|French horn|Wagner tuba|euphonium|baritone horn|tuba|sousaphone|bugle|natural horn|alphorn|didgeridoo|serpent|ophicleide''',roots['instrument'])
group('instrument','Keyboards','instrument','''piano|grand piano|upright piano|prepared piano|electric piano|Rhodes piano|Wurlitzer electric piano|clavinet|harpsichord|clavichord|celesta|pipe organ|Hammond organ|reed organ|accordion|button accordion|bandoneon|concertina|melodion|synthesizer|analog synthesizer|digital synthesizer|modular synthesizer|workstation keyboard|Mellotron|sampler keyboard''',roots['instrument'])
group('instrument','Percussion','instrument','''drum kit|kick drum|snare drum|tom-tom|floor tom|hi-hat|ride cymbal|crash cymbal|china cymbal|splash cymbal|tambourine|triangle|cowbell|claves|woodblock|guiro|maracas|shaker|cabasa|agogo|conga|bongo|timbales|djembe|talking drum|udu|cajon|tabla|mridangam|kanjira|ghatam|taiko|dhol|dholak|bodhran|frame drum|daf|riq|doumbek|darabuka|timpani|bass drum|concert snare|glockenspiel|xylophone|marimba|vibraphone|tubular bells|crotales|handpan|steelpan|kalimba|mbira|gamelan gong|bonang|kendang|angklung|đàn đá::dan da|trống cơm::trong com|phách::phach|song loan|sinh tiền::sinh tien''',roots['instrument'])
group('instrument','Electronic instruments','instrument','''theremin|Ondes Martenot|drum machine|808 drum machine|909 drum machine|electronic drum kit|MIDI controller|sequencer|groovebox|sampler|turntable|DJ mixer|talkbox|vocoder|EWI|keytar|laptop instrument|live coding system|granular synthesizer|FM synthesizer|wavetable synthesizer''',roots['instrument'])
group('instrument','Ensembles','ensemble','''solo|duo|trio|quartet|quintet|sextet|septet|octet|chamber ensemble|string quartet|piano trio|wind quintet|brass quintet|jazz combo|big band|concert band|wind ensemble|marching band|symphony orchestra|chamber orchestra|string orchestra|pit orchestra|choir|chamber choir|mixed choir|male choir|female choir|children choir|gospel choir|a cappella group|rock band|power trio|pop band|boy band|girl group|electronic duo|DJ duo|gamelan ensemble|ca trù ensemble|cải lương ensemble''',roots['instrument'])
group('instrument','Performance techniques','technique','''arco|pizzicato|spiccato|sautillé|martelé|détaché|ricochet bowing|col legno|sul ponticello|sul tasto|string harmonics|artificial harmonics|double stop|triple stop|string tremolo|bow tremolo|scordatura|con sordino|portamento strings|glissando strings|finger vibrato|palm muting|alternate picking|economy picking|sweep picking|tremolo picking|fingerstyle guitar|hybrid picking|guitar tapping|hammer-on|pull-off|string bending|guitar slide|pinch harmonic|natural harmonic|rasgueado|golpe|slap bass|pop bass|walking bass|double-thumb bass|flamenco picado|classical guitar apoyando|classical guitar tirando|single tonguing|double tonguing|triple tonguing|flutter tonguing|woodwind overblowing|multiphonics|circular breathing|brass lip trill|brass fall|brass scoop|brass shake|half-valve effect|wah mute|harmon mute|straight mute|cup mute|piano sustain pedal|piano una corda|piano sostenuto pedal|piano tremolo|piano glissando|prepared-piano technique|keyboard cluster|drum roll|buzz roll|double-stroke roll|single-stroke roll|paradiddle|rimshot|cross-stick|ghost note drumming|brush drumming|mallet roll|dead stroke|flam|drag rudiment|open hi-hat|choke cymbal|hand percussion slap|tabla bols|gamelan interlocking|kotekan''',roots['instrument'])
group('instrument','Orchestration and arranging','concept','''orchestration|instrumentation|arranging|voicing instruments|orchestral doubling|unison doubling|octave doubling|tutti|divisi|solo passage|section writing|register balance|orchestral balance|tone-color blend|timbre contrast|antiphonal writing|call and response orchestration|melody doubling|harmonic padding|countermelody|inner voice|bass line orchestration|pedal-tone orchestration|ostinato orchestration|layered orchestration|transparent texture|dense texture|homophonic texture|polyphonic texture|monophonic texture|heterophonic texture|SATB writing|four-part writing|open score|closed score|transposition instrument|concert-pitch instrument|instrument range|comfortable range|extreme register|idiomatic writing|extended technique|rhythm-section arranging|horn-section arranging|string-section arranging|woodwind-section arranging|brass-section arranging|big-band voicing|drop-2 big-band voicing|shout chorus|background figures|pads|stabs|fills|breaks''',roots['instrument'])

# VOCAL
group('vocal','Voice types','voice-type','''soprano|mezzo-soprano|contralto|countertenor|tenor|baritone|bass|bass-baritone|coloratura soprano|lyric soprano|dramatic soprano|lyric tenor|dramatic tenor|heldentenor|basso profundo|treble voice|child voice''',roots['vocal'])
group('vocal','Vocal techniques','technique','''chest voice|head voice|mixed voice|falsetto|whistle register|vocal fry|belting|twang|vibrato|straight tone|portamento|glissando|melisma|riff and run|coloratura|yodel|overtone singing|throat singing|Tuvan throat singing|growl|death growl|scream vocals|false-cord scream|fry scream|rasp|breathy singing|crooning|sprechstimme|recitative singing|scat singing|vocalese|beatboxing|rap flow|spoken word|chant|call and response vocals|harmony vocals|unison vocals|double tracking vocals|vocal layering|ad-lib|blue note inflection|microtonal ornamentation|nasal resonance|formant tuning|support|breath control|legato singing|staccato singing''',roots['vocal'])

# PRODUCTION
group('production','Recording','process','''tracking|multitrack recording|overdubbing|punch-in|comping|take|room microphone|close microphone|spot microphone|stereo pair|XY stereo|ORTF stereo|mid-side recording|Blumlein pair|spaced pair|Decca tree|direct injection|DI box|re-amping|gain staging|headroom|signal chain|microphone preamp|phantom power|polar pattern|cardioid|omnidirectional|figure-8 microphone|proximity effect|pop filter|isolation booth|room treatment|click track|scratch track|latency monitoring|zero-latency monitoring''',roots['production'])
group('production','Mixing','process','''mix balance|fader automation|pan|stereo width|mono compatibility|equalization|high-pass filter|low-pass filter|band-pass filter|notch filter|shelving EQ|parametric EQ|dynamic EQ|compression|limiting|expansion|noise gate|upward compression|parallel compression|multiband compression|sidechain compression|ducking|de-essing|transient shaping|saturation|tape saturation|tube saturation|distortion|overdrive|clipping|soft clipping|reverb|convolution reverb|algorithmic reverb|plate reverb|spring reverb|room reverb|hall reverb|delay|slapback delay|ping-pong delay|tape delay|chorus effect|flanger|phaser|tremolo effect|vibrato effect|rotary speaker effect|pitch shifting|harmonizer|autotune|pitch correction|time stretching|stereo imaging|mid-side processing|bus processing|mix bus|subgroup|aux send|return channel|parallel processing|wet dry mix|automation|filter sweep|riser|impact sound|ear candy|frequency masking|phase cancellation|phase alignment|polarity inversion|reference track|gain match|loudness match''',roots['production'])
group('production','Mastering','process','''mastering|premaster|master bus|mastering EQ|mastering compression|mastering limiter|true peak limiting|loudness normalization|integrated LUFS|short-term LUFS|momentary LUFS|true peak|inter-sample peak|crest factor|dynamic range|stereo master|mono master|sequencing album|track spacing|fade in|fade out|dither|noise shaping|sample-rate conversion|bit-depth conversion|mastering for streaming|mastering for vinyl|mastering for CD''',roots['production'])
group('production','Synthesis and sound design','process','''subtractive synthesis|additive synthesis|FM synthesis|phase distortion synthesis|wavetable synthesis|granular synthesis|physical modeling synthesis|sample-based synthesis|vector synthesis|west-coast synthesis|oscillator|VCO|DCO|LFO|envelope generator|ADSR envelope|filter cutoff|filter resonance|VCF|VCA|modulation matrix|ring modulation|amplitude modulation|frequency modulation|pulse-width modulation|hard sync|soft sync|unison detune|supersaw|noise oscillator|sample and hold|step sequencer|arpeggiator|portamento synth|glide|velocity sensitivity|aftertouch|MPE|modular patch|CV gate|sidechain envelope|granular cloud|resampling|foley|field recording|soundscape|layering sound design''',roots['production'])
group('production','Digital audio and MIDI','concept','''DAW|digital audio workstation|audio interface|audio buffer|buffer size|round-trip latency|ASIO|Core Audio|WASAPI|MIDI|MIDI note|MIDI channel|MIDI velocity|MIDI CC|control change|pitch bend|channel pressure|polyphonic aftertouch|MPE|MIDI clock|MIDI time code|MTC|MIDI sync|DIN MIDI|USB MIDI|OSC protocol|automation lane|piano roll|event list|quantization grid|swing quantization|humanization|groove template|audio clip|MIDI clip|warping|elastic audio|comping lane|take lane|freeze track|bounce in place|render|offline bounce|real-time bounce|stem export|multitrack export|WAV|AIFF|FLAC|ALAC|MP3|AAC|Opus|Ogg Vorbis|PCM audio|DSD|lossless audio|lossy audio|bitrate|constant bitrate|variable bitrate|metadata tag|ID3 tag|BWF|broadcast wave|timecode|sample-accurate sync|word clock|jitter|clock source|plugin|VST|VST3|Audio Units|AAX|CLAP plugin|plugin latency compensation|oversampling|linear-phase processing|minimum-phase processing''',roots['production'])

# AUDIO
group('audio','Signal and spectrum','concept','''waveform|amplitude|phase|frequency|wavelength|period|sine wave|square wave|triangle wave|sawtooth wave|noise|white noise|pink noise|brown noise|impulse|transient|steady state|DC offset|aliasing|Nyquist frequency|sample rate|bit depth|quantization|quantization noise|dither|FFT|spectrogram|spectrum|spectral centroid|spectral flux|spectral rolloff|zero-crossing rate|RMS level|peak level|crest factor|signal-to-noise ratio|THD|total harmonic distortion|intermodulation distortion|harmonic|overtone|formant|resonant frequency|bandwidth|Q factor|comb filtering|standing wave|room mode''',roots['audio'])
group('audio','Psychoacoustics','concept','''loudness|perceived loudness|equal-loudness contour|Fletcher-Munson curve|masking|frequency masking|temporal masking|critical band|Bark scale|mel scale|ERB scale|pitch perception|timbre perception|roughness|brightness|sharpness|warmth perception|localization|interaural time difference|interaural level difference|Haas effect|precedence effect|binaural hearing|stereo image|phantom center|auditory scene analysis|cocktail party effect|missing fundamental|combination tone|beating|difference tone|consonance perception|dissonance perception|stream segregation|auditory masking threshold''',roots['audio'])
group('audio','Frequency regions','concept','''sub-bass|bass band|low-mid band|midrange|upper-mid band|presence band|brilliance band|air band|mud|boxiness|nasality|honky tone|harshness|sibilance|sparkle|rumble|boom|punch|body|clarity|definition|airiness''',roots['audio'])

# HISTORY
group('history','Western art music eras','era','''Medieval music|Renaissance music|Baroque music|Classical period|Romantic period|late Romanticism|Impressionism|Expressionism|Modernism|Neoclassicism|Serialism|Postmodernism|Contemporary classical music|minimalism movement|spectral music|electroacoustic music|musique concrète|aleatoric music|chance music''',roots['history'])
group('history','Popular music movements','movement','''Tin Pan Alley|ragtime era|blues tradition|jazz age|swing era|bebop revolution|rhythm and blues era|rock and roll era|British Invasion|psychedelic era|singer-songwriter movement|punk movement|post-punk movement|disco era|hip-hop culture|house music movement|techno movement|grunge movement|Britpop movement|EDM festival era|streaming era|bedroom pop movement''',roots['history'])

# RECORDING IDENTITY
group('recording','Work recording release identity','concept','''musical work|composition|song|recording|track|release|album|single|EP|compilation|soundtrack release|recording session|take|master take|alternate take|demo recording|studio recording|live recording|field recording|broadcast recording|remix|remaster|re-recording|cover version|tribute version|acoustic version|unplugged version|instrumental version|karaoke version|radio edit|single edit|extended mix|club mix|dub mix|VIP mix|bootleg remix|mashup|medley|edit|rework|reprise|demo|rough mix|stems|multitrack stems|isolated track|acapella stem|instrumental stem|clean version|explicit version|mono mix|stereo mix|surround mix|spatial audio mix|Dolby Atmos mix''',roots['recording'])

# WORLD / REGIONAL
group('world','Vietnamese traditions','tradition','''nhạc cung đình Huế::nha cung dinh Hue|nhã nhạc::nha nhac|ca trù::ca tru|hát xẩm::hat xam|chèo::cheo|tuồng::tuong|cải lương::cai luong|vọng cổ::vong co|đờn ca tài tử::don ca tai tu|quan họ::quan ho|dân ca Bắc Bộ::dan ca Bac Bo|dân ca Trung Bộ::dan ca Trung Bo|dân ca Nam Bộ::dan ca Nam Bo|hò Huế::ho Hue|hò sông nước::ho song nuoc|lý Nam Bộ::ly Nam Bo|ví giặm::vi giam|bài chòi::bai choi|hát xoan::hat xoan|hát then::hat then|nhạc tài tử::nhac tai tu|nhạc tiền chiến::nhac tien chien|nhạc vàng::nhac vang|nhạc đỏ::nhac do|nhạc quê hương::nhac que huong|bolero Việt Nam::Vietnamese bolero|V-pop::vpop,nhac tre|Vietnamese indie|Vietnamese rock|Vietnamese rap''',roots['world'])
group('world','East and Southeast Asia','tradition','''gagaku|shomyo|minyo|enka|kayokyoku|J-pop|Japanese city pop|Korean court music|pansori|samul nori|K-pop|trot|gugak|Chinese opera|Peking opera|kunqu|C-pop|Mandopop|Cantopop|guoyue|nanguan|gamelan|kroncong|dangdut|campursari|Thai luk thung|Thai mor lam|Thai classical music|Pinoy pop|OPM|kulintang|Malay ghazal|dikir barat|Singapore pop''',roots['world'])
group('world','South Asian traditions','tradition','''Hindustani classical music|Carnatic classical music|raga|tala|dhrupad|khyal|thumri|ghazal|qawwali|bhajan|kirtan|Bollywood music|filmi music|bhangra|lavani|Baul|Rabindra Sangeet|Nazrul Geeti''',roots['world'])
group('world','Middle East and North Africa','tradition','''maqam|maqam music|Arabic classical music|tarab|muwashshah|Andalusian classical music|Persian classical music|dastgah|Turkish classical music|Ottoman classical music|Arab pop|raï|chaabi|gnawa|dabke|khaliji''',roots['world'])
group('world','Sub-Saharan African traditions','tradition','''West African griot tradition|highlife|palm-wine music|juju|fuji|Afrobeat|Afrobeats|amapiano|kwaito|mbube|isicathamiya|mbaqanga|soukus|Congolese rumba|makossa|bikutsi|Ethiopian jazz|Ethio-jazz|morna|funana|sega|maloya''',roots['world'])
group('world','Latin American and Caribbean traditions','tradition','''son cubano|salsa|mambo|cha-cha-cha|rumba cubana|bolero|merengue|bachata|reggaeton|cumbia|vallenato|samba|bossa nova|choro|forro|MPB|tropicália|tango|milonga|nuevo tango|mariachi|ranchera|norteño|corridor::corrido|tejano|calypso|soca|reggae|dub|dancehall|ska|zouk|kompa''',roots['world'])
group('world','European folk traditions','tradition','''Celtic music|Irish traditional music|Scottish traditional music|English folk|Nordic folk|Swedish folk|Norwegian folk|Finnish folk|Balkan folk|Romani music|klezmer|flamenco|fado|rebetiko|sevdalinka|polka tradition|waltz tradition|musette|chanson tradition''',roots['world'])

# GENRE / STYLE taxonomy. Terms are authored/common factual labels; no external bulk list is embedded.
sgroup('classical','genre','classical::classical music|contemporary classical|modern classical|electroacoustic classical|classical crossover',roots['genre'])
sgroup('classical','style','baroque|renaissance music|medieval music|romantic classical|impressionist classical|neoclassical|minimalist classical|spectral music|serial music|atonal classical|chamber music|string quartet|orchestral|symphonic|opera|operetta|oratorio|cantata|concerto|sonata|fugue|choral|sacred classical|early music|post-classical',roots['genre'])
sgroup('jazz','genre','jazz',roots['genre'])
sgroup('jazz','style','ragtime|dixieland|traditional jazz|swing jazz|big band|bebop|hard bop|cool jazz|modal jazz|free jazz|avant-garde jazz|post-bop|jazz fusion|jazz-funk|acid jazz|smooth jazz|vocal jazz|gypsy jazz|manouche jazz|Latin jazz|Afro-Cuban jazz|Brazilian jazz|nu jazz|spiritual jazz|ethio-jazz|jazz rap',roots['genre'])
sgroup('blues','genre','blues',roots['genre'])
sgroup('blues','style','Delta blues|Chicago blues|Texas blues|Piedmont blues|country blues|electric blues|acoustic blues|jump blues|swamp blues|hill country blues|modern blues|blues rock',roots['genre'])
sgroup('rock','genre','rock::rock music',roots['genre'])
sgroup('rock','style','rock and roll|classic rock|hard rock|soft rock|pop rock|alternative rock|indie rock|garage rock|psychedelic rock|progressive rock|art rock|post-rock|punk rock|post-punk|new wave|gothic rock|noise rock|shoegaze|dream pop|Britpop|grunge|southern rock|heartland rock|folk rock|country rock|surf rock|space rock|stoner rock|math rock|emo|post-hardcore|hardcore punk|ska punk|pop punk|power pop|glam rock|industrial rock|electronic rock',roots['genre'])
sgroup('metal','genre','metal::heavy metal',roots['genre'])
sgroup('metal','style','traditional heavy metal|thrash metal|death metal|black metal|doom metal|power metal|progressive metal|symphonic metal|gothic metal|folk metal|industrial metal|alternative metal|nu metal|metalcore|deathcore|grindcore|sludge metal|stoner metal|post-metal|speed metal|groove metal|melodic death metal|technical death metal|brutal death metal|funeral doom|drone metal|blackgaze',roots['genre'])
sgroup('pop','genre','pop::pop music',roots['genre'])
sgroup('pop','style','dance pop|synthpop|electropop|indie pop|dream pop|art pop|baroque pop|chamber pop|power pop|teen pop|bubblegum pop|adult contemporary|easy listening|city pop|J-pop|K-pop|C-pop|Mandopop|Cantopop|V-pop::vpop,Vietnamese pop|Latin pop|Europop|Italo pop|French pop|bedroom pop|hyperpop|future pop|pop rock|pop soul|pop rap|folk pop|country pop',roots['genre'])
sgroup('electronic','genre','electronic::electronica|EDM::electronic dance music',roots['genre'])
sgroup('electronic','style','ambient|dark ambient|drone|new age|house|deep house|acid house|progressive house|tech house|electro house|future house|tropical house|Chicago house|French house|garage house|techno|Detroit techno|minimal techno|acid techno|dub techno|industrial techno|melodic techno|trance|progressive trance|uplifting trance|psytrance|goa trance|acid trance|hard trance|drum and bass::dnb|jungle|liquid drum and bass|neurofunk|breakbeat|UK garage|2-step|dubstep|brostep|future garage|IDM|glitch|microsound|downtempo|trip hop|chillout|lo-fi|chillhop|synthwave|vaporwave|retrowave|darkwave|coldwave|EBM|electro-industrial|electroclash|disco house|nu-disco|breakcore|hardstyle|gabber|hardcore techno|footwork|juke|grime|bass music',roots['genre'])
sgroup('hip-hop','genre','hip hop::hip-hop,rap',roots['genre'])
sgroup('hip-hop','style','old school hip hop|golden age hip hop|East Coast hip hop|West Coast hip hop|Southern hip hop|boom bap|gangsta rap|conscious hip hop|alternative hip hop|underground hip hop|jazz rap|G-funk|trap|drill|cloud rap|emo rap|lo-fi hip hop|instrumental hip hop|turntablism|grime|crunk|phonk|Memphis rap|hyphy|bounce|chopped and screwed',roots['genre'])
sgroup('soul-rnb','genre','R&B::rnb,rhythm and blues|soul',roots['genre'])
sgroup('soul-rnb','style','contemporary R&B|neo soul|Motown|deep soul|southern soul|blue-eyed soul|psychedelic soul|progressive soul|funk|P-funk|electro-funk|boogie|disco|quiet storm|new jack swing|trap soul',roots['genre'])
sgroup('folk-country','genre','folk::folk music|country::country music',roots['genre'])
sgroup('folk-country','style','traditional folk|contemporary folk|indie folk|folk rock|folk pop|singer-songwriter|Americana|bluegrass|old-time|Appalachian folk|country blues|classic country|honky-tonk|outlaw country|country pop|country rock|alternative country|progressive country|western swing|Nashville sound|countrypolitan|bro-country',roots['genre'])
sgroup('reggae','genre','reggae',roots['genre'])
sgroup('reggae','style','roots reggae|dub|dancehall|rocksteady|ska|2 tone|reggae fusion|lovers rock|ragga|dub poetry',roots['genre'])
sgroup('latin','genre','Latin music',roots['genre'])
sgroup('latin','style','salsa|mambo|cha-cha-cha|son cubano|bolero|bossa nova|samba|choro|MPB|tropicália|forro|bachata|merengue|reggaeton|Latin trap|cumbia|vallenato|tango|nuevo tango|milonga|flamenco|ranchera|mariachi|norteño|tejano',roots['genre'])
sgroup('vietnamese','genre','Vietnamese traditional music|Vietnamese popular music',roots['genre'])
sgroup('vietnamese','style','V-pop::vpop,Vietnamese pop|nhạc trẻ::nhac tre|nhạc trữ tình::nhac tru tinh,nhạc vàng,nhac vang|Vietnamese bolero::nhac bolero,bolero vietnamese|nhạc tiền chiến::nhac tien chien|nhạc đỏ::nhac do|nhạc quê hương::nhac que huong|cải lương::cai luong|vọng cổ::vong co|đờn ca tài tử::don ca tai tu|ca trù::ca tru|quan họ::quan ho|chèo|tuồng|hát xẩm::hat xam|nhã nhạc::nha nhac|dân ca::dan ca|bài chòi::bai choi|ví giặm::vi giam|Vietnamese rock|Vietnamese indie|Vietnamese rap',roots['genre'])
sgroup('world','genre','world music',roots['genre'])
sgroup('world','style','Afrobeat|Afrobeats|highlife|amapiano|kwaito|soukus|Congolese rumba|makossa|morna|gnawa|raï|Arabic pop|Persian traditional|Turkish classical|Hindustani classical|Carnatic classical|qawwali|ghazal|bhangra|Bollywood|gamelan|dangdut|kroncong|Thai luk thung|mor lam|pansori|enka|trot|Celtic music|Irish traditional|fado|klezmer|Romani music|calypso|soca|zouk|kompa',roots['genre'])
sgroup('stage-screen','genre','soundtrack|film score|musical theatre',roots['genre'])
sgroup('stage-screen','style','cinematic|video game music|anime soundtrack|television score|library music|production music|show tune|Broadway|West End musical',roots['genre'])
sgroup('experimental','genre','experimental music|avant-garde music',roots['genre'])
sgroup('experimental','style','noise|harsh noise|power electronics|industrial|musique concrète|electroacoustic|acousmatic|free improvisation|sound art|lowercase|glitch|drone|minimalism|microtonal music|algorithmic music|generative music|live coding|data sonification',roots['genre'])

# Enrich calculable theory concepts with interval formulas for future harmonic inference.
INTERVAL_STEPS={'unison':0,'minor second':1,'major second':2,'minor third':3,'major third':4,'perfect fourth':5,'augmented fourth':6,'diminished fifth':6,'tritone':6,'perfect fifth':7,'minor sixth':8,'major sixth':9,'minor seventh':10,'major seventh':11,'octave':12,'minor ninth':13,'major ninth':14,'perfect eleventh':17,'major thirteenth':21}
CHORD_STEPS={'major triad':[0,4,7],'minor triad':[0,3,7],'diminished triad':[0,3,6],'augmented triad':[0,4,8],'suspended second chord':[0,2,7],'suspended fourth chord':[0,5,7],'power chord':[0,7],'major sixth chord':[0,4,7,9],'minor sixth chord':[0,3,7,9],'dominant seventh chord':[0,4,7,10],'major seventh chord':[0,4,7,11],'minor seventh chord':[0,3,7,10],'half-diminished seventh chord':[0,3,6,10],'diminished seventh chord':[0,3,6,9],'minor-major seventh chord':[0,3,7,11],'dominant ninth chord':[0,4,7,10,14],'major ninth chord':[0,4,7,11,14],'minor ninth chord':[0,3,7,10,14],'dominant eleventh chord':[0,4,7,10,14,17],'minor eleventh chord':[0,3,7,10,14,17],'dominant thirteenth chord':[0,4,7,10,14,21],'minor thirteenth chord':[0,3,7,10,14,21],'add9 chord':[0,4,7,14],'six-nine chord':[0,4,7,9,14],'flat-nine dominant':[0,4,7,10,13],'sharp-nine dominant':[0,4,7,10,15],'sharp-eleven dominant':[0,4,7,10,18],'flat-thirteen dominant':[0,4,7,10,20]}
SCALE_STEPS={'major scale':[0,2,4,5,7,9,11],'natural minor scale':[0,2,3,5,7,8,10],'harmonic minor scale':[0,2,3,5,7,8,11],'melodic minor scale':[0,2,3,5,7,9,11],'dorian mode':[0,2,3,5,7,9,10],'phrygian mode':[0,1,3,5,7,8,10],'lydian mode':[0,2,4,6,7,9,11],'mixolydian mode':[0,2,4,5,7,9,10],'aeolian mode':[0,2,3,5,7,8,10],'locrian mode':[0,1,3,5,6,8,10],'major pentatonic':[0,2,4,7,9],'minor pentatonic':[0,3,5,7,10],'blues scale':[0,3,5,6,7,10]}
for concept in concepts:
  label=concept['label'].lower()
  if label in INTERVAL_STEPS: concept['properties']['semitones']=INTERVAL_STEPS[label]
  if concept['kind']=='chord-instance': concept['properties']['intervalSemitones']=CHORD_STEPS.get(concept['properties'].get('quality'),[])
  elif label in CHORD_STEPS: concept['properties']['intervalSemitones']=CHORD_STEPS[label]
  if concept['kind']=='scale-instance': concept['properties']['degreeSemitones']=SCALE_STEPS.get(concept['properties'].get('scale','').lower(),[])
  elif label in SCALE_STEPS: concept['properties']['degreeSemitones']=SCALE_STEPS[label]

# Cross-domain relations for high-value concepts.
by={c['label'].lower():c for c in concepts}
def rel(a,b):
    A=by.get(a.lower()); B=by.get(b.lower())
    if A and B:
      if B['id'] not in A['related']: A['related'].append(B['id'])
      if A['id'] not in B['related']: B['related'].append(A['id'])
for a,b in [
 ('secondary dominant','tonicization'),('tritone substitution','dominant seventh chord'),('swing rhythm','swing jazz'),
 ('four-on-the-floor','house'),('dembow','reggaeton'),('bossa nova clave','bossa nova'),('blast beat','death metal'),
 ('sidechain compression','ducking'),('spectral centroid','brightness'),('frequency masking','equalization'),
 ('live recording','recording'),('cover version','musical work'),('remix','recording'),('remaster','mastering'),
 ('đàn bầu','Vietnamese traditional music'),('cải lương','vọng cổ'),('đờn ca tài tử','vọng cổ'),('ca trù','Vietnamese traditional music')
]: rel(a,b)

payload={
 'version':'music-k2.0',
 'generatedBy':'scripts/build-music-k2-knowledge.py',
 'provenance':{
   'policy':'Original structured knowledge pack built from common factual music terminology. MusicBrainz genre vocabulary was used only as a coverage audit and was not bulk-copied.',
   'musicbrainzCoverageAuditCount':2202,
   'notes':'Descriptions are original concise statements; genre/style labels are factual names.'
 },
 'concepts':concepts
}
OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
from collections import Counter
print('concepts',len(concepts))
print('bytes',OUT.stat().st_size)
print('domains',dict(Counter(c['domain'] for c in concepts)))
print('semantic',sum(1 for c in concepts if 'semantic' in c))
print('relations',sum(len(c['parents'])+len(c['related']) for c in concepts))
