# Stage 3 English – mācību platforma

Angļu valodas mācību lietotne, kas balstīta uz mācību materiāliem. Tā darbojas pārlūkā un iPhone tālrunī (to var pievienot sākuma ekrānam kā lietotni, un tā darbojas arī bez interneta).

## Sadaļas

| Sadaļa | Statuss |
|---|---|
| **Vārdiņi** (Vocabulary) | ✅ Gatava |
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

## Vārdu pievienošana

Visi vārdi ir failā [`data/vocabulary.js`](data/vocabulary.js):

```js
{
  word: "push",
  pos: "verb",
  explanation: "to press against something with your hand or body so that it moves away from you",
  example: "Push the door to open it.",
  translation: "stumt, spiest",
  qa: [
    { q: "What do you do to a door that says PUSH?", a: "I push it to open it." }
  ]
}
```

Pašlaik failā ir **paraugs**, ko aizstās vārdi no “Stage 3 student.pdf”.

## Lietošana iPhone tālrunī

1. GitHub repozitorijā atver **Settings → Pages**.
2. Laukā *Source* izvēlies **Deploy from a branch**, tad zaru `main` un mapi `/ (root)`, un nospied **Save**.
3. Pēc 1–2 minūtēm lietotne būs pieejama adresē `https://agriuslv.github.io/stage_3/`.
4. Atver šo adresi iPhone pārlūkā **Safari**, nospied **Kopīgot** (Share) un izvēlies **Pievienot sākuma ekrānam** (Add to Home Screen).

> Kad maini failus, palielini `VERSION` vērtību failā `sw.js`, lai iPhone ielādētu jauno versiju.

## Tehniski

Tīrs HTML, CSS un JavaScript bez instalējamām atkarībām. Lokāli to var palaist ar `python3 -m http.server` un atvērt adresi `http://localhost:8000`.
