# Stage 3 English – mācību platforma

Angļu valodas mācību lietotne, kas balstīta uz mācību materiāliem. Tā darbojas pārlūkā un iPhone tālrunī (to var pievienot sākuma ekrānam kā lietotni, un tā darbojas arī bez interneta).

## Sadaļas

| Sadaļa | Statuss |
|---|---|
| **Vārdiņi** (Vocabulary) | ✅ Gatava |
| **Statistika** | ✅ Gatava |
| **Diktāti** (Dictations) | ⏳ Nākamais etaps |
| **Uzdevumi** (Exercises) | ⏳ Nākamais etaps |

### Vārdiņi

1. Vārdu sarakstā izvēlies vārdu, piemēram, **push**. Tiek parādīts vārda skaidrojums angļu valodā, piemērs un izruna (🔊).
2. Nospied **“I know this word”**. Tiek uzdoti šī vārda jautājumi no mācību materiāla, un no 4 variantiem jāizvēlas pareizais.
3. Ir divi režīmi:
   - **Jautājums → atbilde**: dots jautājums, jāizvēlas pareizā atbilde;
   - **Atbilde → jautājums**: dota atbilde, jāizvēlas pareizais jautājums.
4. Ja atbilde ir nepareiza, tiek parādīts **skaidrojums angļu valodā** (pareizā atbilde, vārda nozīme un kāpēc izvēlētais variants neder). Tas pats jautājums tiek uzdots **vēlreiz** pēc dažiem citiem jautājumiem.
5. Progress (%) tiek rādīts katram vārdam un kopā. Kļūdas paliek sadaļā **“Atkārtot kļūdas”**, līdz uz tām atbildēsi pareizi.

### Statistika

- **Šodien**: mācībām pavadītais laiks, apgūtie vārdi, atbilžu skaits un pareizo atbilžu %.
- **Kopā apgūti** vārdi no 257 un **dienas pēc kārtas**, kurās esi mācījies.
- Grafiki par pēdējām 14 dienām: **laiks dienā** (minūtes) un **apgūtie vārdi dienā**. Uzspiežot uz stabiņa, redzama precīza vērtība.
- Tabula ar visām mācību dienām.

Laiks tiek skaitīts tikai tad, kad lietotne ir atvērta ekrānā un tu tajā darbojies (pēc 90 sekunžu neaktivitātes skaitīšana apstājas). Vārds skaitās apgūts, kad uz visiem tā jautājumiem vienā no režīmiem pēdējā reize atbildēta pareizi. Dati tiek glabāti tikai tavā ierīcē.

## Saturs un tā atjaunošana

Vārdi, jautājumi un atbildes ir automātiski nolasīti no **“Stage 3 student.pdf”**: 141 kartīte, 257 vārdi un 995 jautājumi ar atbildēm (lpp. 119–207).

- `tools/parse_pdf.py` nolasa PDF (vārdus, jautājumus un atbildes, kā arī alternatīvās atbildes “or:”).
- `tools/glossary.py` satur katra vārda skaidrojumu angļu valodā un tulkojumu latviski. To var labot.
- `tools/build_vocab.py` apvieno abus un izveido `data/vocabulary.js`.

Pēc izmaiņām palaid:

```bash
pip install pdfplumber
python3 tools/build_vocab.py "Stage 3 student.pdf"
```

Diktāti (lpp. 208–) un uzdevumi no tā paša PDF tiks izmantoti nākamajos etapos.

## Lietošana iPhone tālrunī

1. GitHub repozitorijā atver **Settings → Pages**.
2. Laukā *Source* izvēlies **Deploy from a branch**, tad zaru `main` un mapi `/ (root)`, un nospied **Save**.
3. Pēc 1–2 minūtēm lietotne būs pieejama adresē `https://agriuslv.github.io/stage_3/`.
4. Atver šo adresi iPhone pārlūkā **Safari**, nospied **Kopīgot** (Share) un izvēlies **Pievienot sākuma ekrānam** (Add to Home Screen).

> Kad maini failus, palielini `VERSION` vērtību failā `sw.js`, lai iPhone ielādētu jauno versiju.

## Tehniski

Tīrs HTML, CSS un JavaScript bez instalējamām atkarībām. Lokāli to var palaist ar `python3 -m http.server` un atvērt adresi `http://localhost:8000`.
