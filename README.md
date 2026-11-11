# Stage 3 English – mācību platforma

Angļu valodas mācību lietotne, kas balstīta uz mācību materiāliem. Tā darbojas pārlūkā un iPhone tālrunī (to var pievienot sākuma ekrānam kā lietotni, un tā darbojas arī bez interneta).

## Sadaļas

| Sadaļa | Statuss |
|---|---|
| **Vārdiņi** (Vocabulary) | ✅ Gatava |
| **Diktāti** (Dictations) | ⏳ Nākamais etaps |
| **Uzdevumi** (Exercises) | ⏳ Nākamais etaps |

### Vārdiņi

- Jautājums ar 4 atbilžu variantiem, no kuriem viens ir pareizs.
- Jautājumu veidi: *nozīme → vārds*, *vārds → nozīme*, *teikums ar trūkstošo vārdu*, kā arī paša sagatavoti jautājumi.
- Ja atbilde ir nepareiza, tiek parādīts **skaidrojums angļu valodā**: pareizā atbilde, vārda nozīme, piemērs, lietojums un tas, ko nozīmē izvēlētais (nepareizais) vārds.
- Progress tiek saglabāts ierīcē. Vārdi, kuros pieļautas kļūdas, tiek rādīti biežāk, un tos var atkārtot ar pogu **“Atkārtot kļūdas”**.
- Vārda izrunu var noklausīties (🔊).

## Vārdu pievienošana

Visi vārdi ir failā [`data/vocabulary.js`](data/vocabulary.js). Katrai tēmai (unit) ir savs vārdu saraksts:

```js
{
  word: "borrow",
  pos: "verb",
  meaning: "to take and use something that belongs to someone else, and return it later",
  example: "Can I borrow your pen for a minute?",
  translation: "aizņemties",
  usage: "You BORROW something FROM someone; someone LENDS something TO you."
}
```

Pašlaik failā ir tikai **paraugs**, ko aizstās vārdi no mācību materiāliem.

## Lietošana iPhone tālrunī

1. GitHub repozitorijā atver **Settings → Pages**.
2. Laukā *Source* izvēlies **Deploy from a branch**, tad zaru `main` un mapi `/ (root)`, un nospied **Save**.
3. Pēc 1–2 minūtēm lietotne būs pieejama adresē `https://agriuslv.github.io/stage_3/`.
4. Atver šo adresi iPhone pārlūkā **Safari**, nospied **Kopīgot** (Share) un izvēlies **Pievienot sākuma ekrānam** (Add to Home Screen).

> Kad maini failus, palielini `VERSION` vērtību failā `sw.js`, lai iPhone ielādētu jauno versiju.

## Tehniski

Tīrs HTML, CSS un JavaScript bez instalējamām atkarībām. Lokāli to var palaist ar `python3 -m http.server` un atvērt adresi `http://localhost:8000`.
