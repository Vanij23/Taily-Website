/* =====================================================================
   TAILY DEMO v3 · DATA
   Realistic estimates for India, 2026. Plain HTML/CSS/JS, no backend.
   ===================================================================== */

/* ---------- Lives ----------
   fixed: [label, amount, icon, title, note]  (shown one by one on the bill road) */
const LIVES = {
  school:{ title:'School student', face:'a', home:'Lives at home with parents', from:'Pocket money from home',
    income:2000, fixed:[
      ['Canteen snacks', 600, 'food', 'Canteen comes first.', '₹30 a day for 20 school days.'],
      ['Bus and auto', 400, 'bus', 'Then getting around.', 'Top-ups when the school bus doesn’t cover it.'] ],
    goals:[ { label:'Laptop (your share)', amount:6000 }, { label:'Trip with friends', amount:3000 }, { label:'Wireless headphones', amount:2400 } ], pick:1, step:200, needs:300 },
  college:{ title:'College student', face:'b', home:'Lives in a college hostel', from:'Allowance from home',
    income:15000, fixed:[
      ['Hostel room', 6500, 'house', 'Rent goes first.', 'A shared room near campus. Paid on the 1st, before anything else.'],
      ['Mess food', 3500, 'food', 'Then food.', 'Mess meals for the month.'],
      ['Transport', 800, 'bus', 'Getting around.', 'Bus pass and the odd auto ride.'],
      ['Phone and data', 350, 'phone', 'Staying connected.', 'Your monthly prepaid plan.'],
      ['Laundry and toiletries', 450, 'basket', 'The small stuff.', 'Soap, shampoo and the laundry.'] ],
    goals:[ { label:'Laptop', amount:24000 }, { label:'Trip with friends', amount:12000 }, { label:'New phone', amount:15000 } ], pick:1, step:1000, needs:900 },
  job:{ title:'First-job earner', face:'c', home:'Lives in their own rented apartment', from:'Salary, in hand',
    income:25000, fixed:[
      ['Rent', 8000, 'house', 'Rent goes first.', 'A small rented apartment of your own.'],
      ['Food and groceries', 4500, 'food', 'Then food.', 'Groceries and cooking at home.'],
      ['Commute', 1500, 'bus', 'Getting to work.', 'Metro card top-ups.'],
      ['Phone and Wi-Fi', 600, 'phone', 'Staying connected.', 'Your phone plan and home Wi-Fi.'],
      ['Electricity', 400, 'bolt', 'Lights and fans.', 'Lights, fans and the fridge.'] ],
    goals:[ { label:'Laptop', amount:45000 }, { label:'Trip with friends', amount:24000 }, { label:'Emergency fund', amount:30000 } ], pick:1, step:1000, needs:3000 },
};
const START_HAPPY = 70, WEEK_STRESS = 5, ON_TRACK_HAPPY = 45, BURNOUT = 20;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ---------- Scenario cards ----------
   jar: which jar the card is about (sets its colour): needs | wants | save | happy
   choice: kind need|want|scam, cost, happy, income {to|split, amount}, move {from,to,amount},
   later (card that comes back next week), skipNeed, skipFriends, payLater {now,each,count}, wish, line
   slots: 4 weeks × 2 slots; each slot draws one card from its pool, so every playthrough differs. */
const C3 = (a, b, c) => [a, b, c];
const DECKS = {
school:{
  slots:[ [['geometry','guide'], ['chaat','bday']], [['skin','pe'], ['idcard','upi']], [['nani','tutor'], ['jar','drawer']], [['throat','guard'], ['party','picnic']] ],
  geometry:{ jar:'needs', art:'compass', title:'Your geometry box breaks before the maths test.', body:'The test is on Thursday.', choices:C3(
    { t:'Buy a new box', kind:'need', cost:180, line:'Sorted early. Needs did its job.' },
    { t:'Buy just a compass', kind:'need', cost:60, line:'Only what you need. Smart.' },
    { t:'Borrow a friend’s', skipNeed:true, later:'geometry2', line:'Free for now. Let’s see if it lasts.' })},
  geometry2:{ jar:'needs', art:'compass', title:'Your friend needs their compass in the same test.', body:'The shop near school charges more on test day.', choices:C3(
    { t:'Buy one at the school shop', kind:'need', cost:120, line:'A skipped need came back, and it cost double.' },
    { t:'Share it and finish late', happy:-8, line:'No spend, but a stressful test.' },
    { t:'Draw the circles freehand', happy:-5, line:'Wobbly circles. Lesson learned.' })},
  guide:{ jar:'needs', art:'book', title:'Your tuition teacher wants everyone to buy a ₹250 guide book.', body:'Half the class already has it.', choices:C3(
    { t:'Buy a new copy', kind:'need', cost:250, line:'Done. Needs covered it.' },
    { t:'Buy a senior’s old copy', kind:'need', cost:120, line:'Same answers, half the price.' },
    { t:'Use the school library copy', happy:-3, line:'Free, if you get there before everyone else.' })},
  chaat:{ jar:'happy', art:'plate', short:'Chaat with friends', title:'Friends are going for chaat after school.', body:'Everyone’s going to the stall near the gate.', choices:C3(
    { t:'Chaat and a cold drink', kind:'want', cost:120, happy:10, line:'Good times. Wants is for exactly this.' },
    { t:'Just the chaat', kind:'want', cost:60, happy:6, line:'All the fun, half the spend.' },
    { t:'Go straight home', happy:-4, skipFriends:true, line:'Money kept. Skip too often and the invites slow down.' })},
  bday:{ jar:'happy', art:'cake', short:'Friend’s birthday gift', title:'Your best friend’s birthday. The group gift is ₹200 each.', body:'It’s a surprise at lunch break.', choices:C3(
    { t:'Chip in ₹200', kind:'want', cost:200, happy:10, line:'Worth it. Your friend will remember this.' },
    { t:'Make a handmade card', kind:'want', cost:30, happy:6, line:'Thoughtful, and nearly free.' },
    { t:'Skip it', happy:-6, skipFriends:true, line:'Money kept, but it stings a bit.' })},
  skin:{ jar:'wants', art:'bag', short:'Game skin', title:'A new skin in your favourite game: ₹399.', body:'It’s only on sale this weekend.', choices:C3(
    { t:'Buy it now', kind:'want', cost:399, happy:8, line:'Looks cool. Check what’s left in Wants.' },
    { t:'Pay later: 3 × ₹150', kind:'want', payLater:{ now:150, each:150, count:3 }, happy:8, line:'₹450 in the end, not ₹399. And two payments follow you.' },
    { t:'Wishlist it for my birthday', happy:-2, wish:true, line:'If you still want it later, it’s worth it.' })},
  pe:{ jar:'needs', art:'shoe', title:'Sports day is coming. You need proper sports shoes: ₹699.', body:'Your old ones are a size too small.', choices:C3(
    { t:'Buy new ones', kind:'need', cost:699, line:'Comfortable feet. Needs ran out, so Wants chipped in.' },
    { t:'Wear your cousin’s old pair', happy:-2, line:'A bit worn, but free.' },
    { t:'Run in school shoes', happy:-6, line:'No spend, but sore feet and a slow race.' })},
  idcard:{ jar:'needs', art:'id', title:'You lost your school ID card.', body:'A new one costs ₹150 at the office.', choices:C3(
    { t:'Get a new one now', kind:'need', cost:150, line:'Annoying, but handled.' },
    { t:'Check lost-and-found first', skipNeed:true, later:'idcard2', line:'Worth a look. Fingers crossed.' },
    { t:'Ask a parent to pay', happy:-4, line:'Covered this time. It still costs someone.' })},
  idcard2:{ jar:'needs', art:'id', title:'It wasn’t in lost-and-found. Now there’s a late fine.', body:'New card ₹150 plus a ₹50 fine.', choices:C3(
    { t:'Pay ₹200', kind:'need', cost:200, line:'Waiting turned ₹150 into ₹200.' },
    { t:'Pay just the card for now', kind:'need', cost:150, happy:-4, line:'The fine follows you to class. Awkward.' },
    { t:'Skip the library this month', happy:-10, line:'No spend, but no library either.' })},
  upi:{ jar:'save', art:'alert', title:'A UPI request asks for your PIN so you can “receive ₹500”.', body:'It’s from a number you don’t know.', choices:C3(
    { t:'Enter the PIN', kind:'scam', cost:500, happy:-10, line:'You never need a PIN to receive money. That ₹500 is gone.' },
    { t:'Decline it and tell a parent', happy:2, line:'Exactly right. A PIN is only for paying.' },
    { t:'Ignore it', line:'Safe. Next time, decline and report it too.' })},
  nani:{ jar:'save', art:'gift', short:'Treat with ₹500', title:'Your grandmother gives you ₹500 at a family function.', body:'Money you didn’t plan for.', choices:C3(
    { t:'Put it all in Save', income:{ to:'save', amount:500 }, happy:2, line:'Your goal just jumped closer.' },
    { t:'Half to Save, half to Wants', income:{ split:true, amount:500 }, happy:5, line:'A bit of both. Very balanced.' },
    { t:'Spend it on a treat', income:{ to:'wants', amount:500 }, kind:'want', cost:500, happy:12, line:'Fun day. The ₹500 is gone.' })},
  tutor:{ jar:'save', art:'coins', title:'Your neighbour asks you to help her son with homework.', body:'₹300 for the month, three evenings a week.', choices:C3(
    { t:'Say yes', income:{ to:'save', amount:300 }, happy:-3, line:'You earned ₹300. Earning is a lever too.' },
    { t:'Weekends only, for ₹150', income:{ to:'save', amount:150 }, line:'Some money, some rest.' },
    { t:'Say no, exams first', happy:2, line:'Fair. Your time matters too.' })},
  jar:{ jar:'save', art:'jar', title:'“A little now makes later easier.”', body:'Your classmate drops ₹10 into a jar every day. By the term break she has ₹1,000.', choices:C3(
    { t:'Move ₹100 from Wants to Save', move:{ from:'wants', to:'save', amount:100 }, line:'You just paid yourself again.' },
    { t:'Move ₹50 from Wants to Save', move:{ from:'wants', to:'save', amount:50 }, line:'Small, but it’s the habit that counts.' },
    { t:'Nice idea. Not today.', line:'Fair. The idea comes back at the end of the month.' })},
  drawer:{ jar:'save', art:'drawer', title:'Where do you keep your savings?', body:'Your cousin’s money went missing from a drawer during a family visit.', choices:C3(
    { t:'Open a bank account with a parent', happy:2, line:'Safer, and it can earn a little interest.' },
    { t:'Keep it in my drawer', later:'drawer2', line:'Your call. Let’s see.' },
    { t:'Hide it in a book', later:'drawer2', line:'Creative. Let’s see.' })},
  drawer2:{ jar:'save', art:'drawer', title:'₹100 is missing from where you kept your savings.', body:'Nobody knows where it went.', choices:C3(
    { t:'Move the rest to a bank account', kind:'scam', cost:100, happy:-4, line:'₹100 gone, but the rest is safe now.' },
    { t:'Keep it there, hide it better', kind:'scam', cost:100, happy:-6, line:'₹100 gone, and it could happen again.' },
    { t:'Ask everyone at home', kind:'scam', cost:100, happy:-8, line:'Awkward, and the ₹100 is still gone.' })},
  throat:{ jar:'needs', art:'thermo', title:'You wake up with a sore throat.', body:'The chemist is on the way to school.', choices:C3(
    { t:'Buy lozenges and syrup', kind:'need', cost:90, line:'Rest up. Needs covered it.' },
    { t:'Haldi milk at home', kind:'need', cost:20, happy:-3, line:'Cheap. Slower to feel better.' },
    { t:'Ignore it', skipNeed:true, later:'throat2', line:'Hope it passes.' })},
  throat2:{ jar:'needs', art:'thermo', title:'The sore throat turned into a fever.', body:'A doctor’s visit and medicine cost ₹300.', choices:C3(
    { t:'See the doctor', kind:'need', cost:300, line:'A ₹90 problem became a ₹300 one.' },
    { t:'Government clinic, long wait', kind:'need', cost:80, happy:-6, line:'Cheaper, but a whole morning gone.' },
    { t:'Rest it out', happy:-12, line:'No spend. A miserable week.' })},
  guard:{ jar:'needs', art:'phonecrack', title:'The screen guard on your phone cracked.', body:'The screen underneath is fine, for now.', choices:C3(
    { t:'Buy a good tempered glass', kind:'need', cost:150, line:'Protected properly.' },
    { t:'Buy a basic one', kind:'need', cost:60, line:'Cheap and does the job.' },
    { t:'Leave it', skipNeed:true, later:'guard2', line:'Hope it holds.' })},
  guard2:{ jar:'needs', art:'phonecrack', title:'You dropped the phone. The screen itself cracked.', body:'Repair is ₹1,200. Your parents will pay half if you pay half.', choices:C3(
    { t:'Pay your half: ₹600', kind:'need', cost:600, line:'A ₹150 guard would have saved ₹600.' },
    { t:'Use it cracked for now', happy:-8, line:'No spend, but every swipe is a reminder.' },
    { t:'Ask them to pay it all', happy:-6, line:'They agreed, but they weren’t happy.' })},
  party:{ jar:'happy', art:'cake', short:'Teacher’s farewell', title:'Class farewell for a favourite teacher. ₹150 each.', body:'Cake and a gift from the whole class.', choices:C3(
    { t:'Chip in ₹150', kind:'want', cost:150, happy:10, line:'Worth it. You’ll remember this one.' },
    { t:'Make a card instead', kind:'want', cost:30, happy:5, line:'Thoughtful, and cheap.' },
    { t:'Skip it', happy:-6, skipFriends:true, line:'Money kept, but you missed the moment.' })},
  picnic:{ jar:'happy', art:'mountain', short:'Class picnic', title:'Class picnic to a water park: ₹600 with food.', body:'Everyone’s talking about it.', choices:C3(
    { t:'Go and buy food there', kind:'want', cost:600, happy:14, line:'Best day of the month. Wants paid for it.' },
    { t:'Go, carry lunch from home', kind:'want', cost:400, happy:11, line:'Same fun, ₹200 less.' },
    { t:'Skip it', happy:-8, skipFriends:true, line:'Money kept, but you missed the photos and the jokes.' })},
},
college:{
  slots:[ [['manual','examfee'], ['movie','delivery']], [['sneakers','subs'], ['charger','screen']], [['aunt','gig'], ['babylon','lend']], [['cold','voucher'], ['farewell','fest']] ],
  manual:{ jar:'needs', art:'book', title:'Your lab needs a ₹450 manual by Monday.', body:'The professor checks it in the first practical.', choices:C3(
    { t:'Buy a new copy', kind:'need', cost:450, line:'Sorted early. Needs did its job.' },
    { t:'Buy a senior’s used copy', kind:'need', cost:180, line:'Same pages, ₹270 less. Smart need.' },
    { t:'Share a friend’s copy', skipNeed:true, later:'manual2', line:'Free for now. Let’s see if it lasts.' })},
  manual2:{ jar:'needs', art:'book', title:'Exams in two weeks. Your friend wants their manual back.', body:'Sharing worked until it didn’t.', choices:C3(
    { t:'Photocopy the chapters', kind:'need', cost:220, line:'A skipped need came back, a bit smaller.' },
    { t:'Buy a used copy now', kind:'need', cost:250, line:'It cost more now than it would have then.' },
    { t:'Study from phone photos', happy:-8, line:'Free, but squinting at photos is stressful.' })},
  examfee:{ jar:'needs', art:'id', title:'The exam form fee is ₹500. After Friday there’s a ₹200 late fee.', body:'The college office closes early on Fridays.', choices:C3(
    { t:'Pay ₹500 today', kind:'need', cost:500, line:'Done on time. No fine.' },
    { t:'Pay on Monday with the fine', kind:'need', cost:700, line:'The same form, ₹200 more for waiting.' },
    { t:'Ask home to pay it directly', happy:-5, line:'Covered, but you had to explain why.' })},
  movie:{ jar:'happy', art:'ticket', short:'Movie night', title:'Friends are going to a movie on Saturday.', body:'₹250 a ticket, plus the snacks everyone gets.', choices:C3(
    { t:'Go, with snacks', kind:'want', cost:450, happy:12, line:'Good night out. Wants is for exactly this.' },
    { t:'Go, skip the snacks', kind:'want', cost:250, happy:8, line:'All the fun, half the spend.' },
    { t:'Stay in', happy:-4, skipFriends:true, line:'Money kept. Skip too often and the invites slow down.' })},
  delivery:{ jar:'wants', art:'foodbag', short:'Late-night food', title:'Midnight cravings. A food delivery would be ₹350.', body:'The mess closed hours ago.', choices:C3(
    { t:'Order it', kind:'want', cost:350, happy:6, line:'Tasty. Small orders add up fast, though.' },
    { t:'Instant noodles from the night canteen', kind:'want', cost:60, happy:4, line:'Cheap and it hits the spot.' },
    { t:'Sleep it off', happy:-2, line:'Money kept. Breakfast tastes better now.' })},
  sneakers:{ jar:'wants', art:'shoe', short:'Sneakers', title:'The sneakers you liked are on sale: ₹1,999.', body:'The sale ends tonight.', choices:C3(
    { t:'Buy now', kind:'want', cost:1999, happy:10, line:'Nice shoes. Wants couldn’t cover it, so Save paid the rest.' },
    { t:'Pay later: 4 × ₹550', kind:'want', payLater:{ now:550, each:550, count:4 }, happy:10, line:'₹2,200 in the end, not ₹1,999. And three instalments follow you.' },
    { t:'Add to wishlist', happy:-2, wish:true, line:'If you still want them next month, they’re worth it.' })},
  subs:{ jar:'wants', art:'tv', short:'Streaming plan', title:'Your free streaming trial ends tomorrow. Then ₹199 a month.', body:'It renews on its own unless you cancel.', choices:C3(
    { t:'Let it renew', kind:'want', cost:199, happy:4, line:'Fine, if you watch it. Unused plans are a quiet leak.' },
    { t:'Share a family plan with 3 roommates', kind:'want', cost:70, happy:4, line:'Same shows, a third of the price.' },
    { t:'Cancel it today', line:'Good catch. Trials that auto-renew are how small costs sneak in.' })},
  charger:{ jar:'needs', art:'plug', title:'Your laptop charger stops working.', body:'Your assignment is due on Friday.', choices:C3(
    { t:'Buy the original', kind:'need', cost:1800, line:'Pricey. Needs ran dry and Wants paid the rest.' },
    { t:'Buy a compatible one', kind:'need', cost:700, line:'Cheaper and it works.' },
    { t:'Borrow a friend’s for now', skipNeed:true, later:'charger2', line:'Free for now. Your friend will want it back.' })},
  charger2:{ jar:'needs', art:'plug', title:'Your friend needs their charger back today.', body:'The assignment isn’t finished yet.', choices:C3(
    { t:'Buy the original', kind:'need', cost:1800, line:'Back where you started, a week later.' },
    { t:'Buy a compatible one', kind:'need', cost:700, line:'Done. Next time, buy it the first time.' },
    { t:'Work only in the library', happy:-8, line:'No spend, but long library days wear you down.' })},
  screen:{ jar:'needs', art:'phonecrack', title:'Your phone screen cracks.', body:'It still works, but the top corner is shattered.', choices:C3(
    { t:'Service centre repair', kind:'need', cost:2400, line:'Good as new. Needs and Wants both paid.' },
    { t:'Local repair shop', kind:'need', cost:900, line:'Works fine. Cheaper, no warranty.' },
    { t:'Put a ₹150 glass on it', kind:'need', cost:150, happy:-4, line:'Cheap fix. You’ll see the crack every day.' })},
  aunt:{ jar:'save', art:'gift', short:'Birthday dinner', title:'Your aunt sends ₹1,000 for your birthday.', body:'Money you didn’t plan for.', choices:C3(
    { t:'Put it all in Save', income:{ to:'save', amount:1000 }, happy:2, line:'Your goal just jumped closer.' },
    { t:'Half to Save, half to Wants', income:{ split:true, amount:1000 }, happy:5, line:'A bit of both. Very balanced.' },
    { t:'Birthday dinner with friends', income:{ to:'wants', amount:1000 }, kind:'want', cost:1000, happy:12, line:'A great night. The ₹1,000 is gone.' })},
  gig:{ jar:'save', art:'coins', title:'A senior offers you a ₹1,500 poster-design gig for the fest.', body:'Two late nights before the deadline.', choices:C3(
    { t:'Take it', income:{ to:'save', amount:1500 }, happy:-4, line:'You earned ₹1,500. Earning is a lever too.' },
    { t:'Take it and split with a friend', income:{ to:'save', amount:750 }, line:'Half the money, half the late nights.' },
    { t:'Say no, exams first', happy:2, line:'Fair. Rest matters too.' })},
  babylon:{ jar:'save', art:'scroll', title:'“A part of all I get is mine to keep.”', body:'A senior who always seems calm about money tells you her rule. From every ₹100 she gets, she keeps ₹10.', choices:C3(
    { t:'Move ₹200 from Wants to Save', move:{ from:'wants', to:'save', amount:200 }, line:'You just paid yourself again.' },
    { t:'Move ₹100 from Wants to Save', move:{ from:'wants', to:'save', amount:100 }, line:'Small, but it’s the habit that counts.' },
    { t:'Nice idea. Not today.', line:'Fair. The idea comes back at the end of the month.' })},
  lend:{ jar:'save', art:'hands', title:'Your roommate asks to borrow ₹1,000 till his scholarship comes.', body:'He says it’ll come “next week, for sure”.', choices:C3(
    { t:'Lend ₹1,000', kind:'want', cost:1000, later:'lend2', line:'Kind. Lend only what you could manage without.' },
    { t:'Lend ₹500', kind:'want', cost:500, later:'lend2b', line:'A middle path. Helpful, and less at risk.' },
    { t:'Say no kindly', happy:-3, line:'Hard to say, but your money stays safe.' })},
  lend2:{ jar:'save', art:'hands', title:'The scholarship is late. Your roommate pays back ₹500 for now.', body:'The other ₹500 is “coming soon”.', choices:C3(
    { t:'Put the ₹500 in Save', income:{ to:'save', amount:500 }, line:'Half back. Lending can mean waiting, or losing.' },
    { t:'Put the ₹500 in Wants', income:{ to:'wants', amount:500 }, line:'Half back. The rest is still out there.' },
    { t:'Say keep it till you’re sorted', happy:4, line:'Generous. That’s ₹1,000 out of your month.' })},
  lend2b:{ jar:'save', art:'hands', title:'Your roommate pays back the ₹500.', body:'Right on time, with a thank-you samosa.', choices:C3(
    { t:'Put it in Save', income:{ to:'save', amount:500 }, happy:2, line:'All back. Small loans are easier to get back.' },
    { t:'Put it in Wants', income:{ to:'wants', amount:500 }, happy:2, line:'All back, ready for the weekend.' },
    { t:'Split it', income:{ split:true, amount:500 }, happy:2, line:'All back. Balanced.' })},
  cold:{ jar:'needs', art:'thermo', title:'You catch a bad cold.', body:'The pharmacy near the hostel is open.', choices:C3(
    { t:'Buy the medicines', kind:'need', cost:250, line:'Rest up. Needs covered it.' },
    { t:'Home remedies', kind:'need', cost:60, happy:-3, line:'Cheap. Slower to feel better.' },
    { t:'Ignore it', skipNeed:true, later:'cold2', line:'Hope it passes.' })},
  cold2:{ jar:'needs', art:'thermo', title:'The cold turned into a fever.', body:'The doctor and medicines will cost ₹600.', choices:C3(
    { t:'See the doctor', kind:'need', cost:600, line:'A ₹250 problem became a ₹600 one.' },
    { t:'Campus clinic, long wait', kind:'need', cost:200, happy:-6, line:'Cheaper, but a whole day lost.' },
    { t:'Rest it out', happy:-12, line:'No spend. A miserable week.' })},
  voucher:{ jar:'save', art:'alert', title:'“You won a ₹5,000 voucher! Pay ₹99 delivery to claim it.”', body:'A message with a link, from an unknown number.', choices:C3(
    { t:'Pay the ₹99', kind:'scam', cost:99, happy:-6, line:'There was no voucher. Real prizes never ask you to pay.' },
    { t:'Delete and block', line:'Right call. If you have to pay to win, it’s a scam.' },
    { t:'Report it (helpline 1930)', happy:2, line:'Even better. Reporting helps stop it for others.' })},
  farewell:{ jar:'happy', art:'cake', short:'Farewell dinner', title:'Seniors’ farewell dinner. Everyone chips in ₹500.', body:'Your whole batch is going.', choices:C3(
    { t:'Chip in ₹500', kind:'want', cost:500, happy:10, line:'Worth it. You’ll remember this one.' },
    { t:'Chip in for the gift only', kind:'want', cost:150, happy:4, line:'You showed up for the part that mattered.' },
    { t:'Skip it', happy:-6, skipFriends:true, line:'Money kept, but you missed a big night.' })},
  fest:{ jar:'happy', art:'ticket', short:'Fest pass', title:'The college fest pass is ₹800 for all three days.', body:'Concert night is on day three.', choices:C3(
    { t:'Buy the 3-day pass', kind:'want', cost:800, happy:12, line:'Three great days. Wants paid for it.' },
    { t:'Buy just concert night', kind:'want', cost:300, happy:8, line:'The best night, for less.' },
    { t:'Volunteer for a free pass', happy:6, line:'Free entry and new friends. Smart.' })},
},
job:{
  slots:[ [['shoes','credit'], ['lunch','orders']], [['watch','ott'], ['leak','home']], [['bonus','side'], ['accounts','kyc']], [['stomach','battery'], ['sangeet','offsite']] ],
  shoes:{ jar:'needs', art:'shoe', title:'You need formal shoes for a client visit on Monday.', body:'Your old pair has a split sole.', choices:C3(
    { t:'Buy a good pair', kind:'need', cost:1800, line:'They’ll last years. Needs covered it.' },
    { t:'Buy a budget pair', kind:'need', cost:900, line:'Good enough for now.' },
    { t:'Borrow your flatmate’s', skipNeed:true, later:'shoes2', line:'Free for now. He’ll need them back.' })},
  shoes2:{ jar:'needs', art:'shoe', title:'Your flatmate needs his shoes for his own interview.', body:'You have another client visit tomorrow.', choices:C3(
    { t:'Buy a budget pair, last minute', kind:'need', cost:1100, line:'Same shoes, ₹200 more for the rush.' },
    { t:'Buy the good pair', kind:'need', cost:1800, line:'Done properly this time.' },
    { t:'Wear sneakers', happy:-8, line:'No spend, but an awkward meeting.' })},
  credit:{ jar:'wants', art:'card', short:'Credit card shopping', title:'Your bank offers a pre-approved credit card. ₹50,000 limit.', body:'There’s a sale on clothes this weekend.', choices:C3(
    { t:'Take it and spend ₹4,000 on clothes', kind:'want', payLater:{ now:0, each:4000, count:2 }, happy:8, line:'The ₹4,000 bill arrives next month. Miss it and interest is around 3–4% a month.' },
    { t:'Take it, use it only for regular bills', happy:2, line:'Used like a debit card and paid in full, a card is fine.' },
    { t:'Say no for now', line:'Fair. A limit isn’t money you have.' })},
  lunch:{ jar:'happy', art:'plate', short:'Team lunch', title:'Your team takes you out for a welcome lunch.', body:'The bill is split. Your share is ₹700.', choices:C3(
    { t:'Go and order freely', kind:'want', cost:700, happy:10, line:'Good start with the team.' },
    { t:'Go and order light', kind:'want', cost:400, happy:7, line:'Same table, smaller bill.' },
    { t:'Skip it, eat at your desk', happy:-5, skipFriends:true, line:'Money kept, but first impressions count too.' })},
  orders:{ jar:'wants', art:'foodbag', short:'Food deliveries', title:'You’ve ordered dinner five times this week: ₹1,500 so far.', body:'Work ran late every night.', choices:C3(
    { t:'Keep ordering this week too', kind:'want', cost:1500, happy:4, line:'Easy, but ₹6,000 a month at this rate.' },
    { t:'Cook with flatmates: ₹400 groceries', kind:'want', cost:400, happy:6, line:'Cheaper, and dinner turned into a hangout.' },
    { t:'Pack lunch boxes from home', kind:'want', cost:200, happy:2, line:'The cheapest option. A bit more effort.' })},
  watch:{ jar:'wants', art:'watch', short:'Smartwatch', title:'A smartwatch you’ve wanted drops to ₹5,999.', body:'The deal ends at midnight.', choices:C3(
    { t:'Buy it now', kind:'want', cost:5999, happy:10, line:'Shiny. Check how much Wants has left.' },
    { t:'No-cost EMI: 6 × ₹1,050', kind:'want', payLater:{ now:1050, each:1050, count:6 }, happy:10, line:'“No-cost” plus a fee: ₹6,300 in the end. Five EMIs follow you.' },
    { t:'Add to wishlist', happy:-2, wish:true, line:'If you still want it next month, it’s worth it.' })},
  ott:{ jar:'wants', art:'tv', short:'Streaming apps', title:'Three streaming apps renew this week: ₹1,200 a month together.', body:'You mostly watch one of them.', choices:C3(
    { t:'Keep all three', kind:'want', cost:1200, happy:4, line:'Fine, if you watch them. Unused plans are a quiet leak.' },
    { t:'Keep just the one you watch', kind:'want', cost:400, happy:3, line:'Same shows you actually watch, ₹800 less.' },
    { t:'Cancel all of them', happy:-2, line:'₹1,200 kept. Weekends feel a bit quieter.' })},
  leak:{ jar:'needs', art:'wrench', title:'The bathroom tap bursts. The plumber charges ₹2,400.', body:'Split three ways with your flatmates: ₹800 each.', choices:C3(
    { t:'Pay your ₹800 share', kind:'need', cost:800, line:'Fixed. Needs did its job.' },
    { t:'Fix it yourselves with a ₹300 kit', kind:'need', cost:300, happy:-4, line:'A wet Saturday, but cheaper.' },
    { t:'Put it off till next week', skipNeed:true, later:'leak2', line:'A bucket under the tap. For now.' })},
  leak2:{ jar:'needs', art:'wrench', title:'The leak spread to the floor tiles.', body:'The repair is now ₹4,200. Your share: ₹1,400.', choices:C3(
    { t:'Pay your ₹1,400 share', kind:'need', cost:1400, line:'Waiting turned ₹800 into ₹1,400.' },
    { t:'Pay half now, half next month', kind:'need', cost:700, happy:-6, line:'Your flatmates aren’t thrilled.' },
    { t:'Keep the bucket', happy:-12, line:'No spend. A soggy, stressful week.' })},
  home:{ jar:'needs', art:'homeh', title:'Your parents ask for ₹3,000 for your grandmother’s medicines.', body:'They don’t usually ask.', choices:C3(
    { t:'Send ₹3,000', kind:'need', cost:3000, happy:6, line:'Family first. This is what Needs is for.' },
    { t:'Send ₹1,500 now, more next month', kind:'need', cost:1500, happy:2, line:'Some help now, a plan for the rest.' },
    { t:'Say not this month', happy:-10, line:'Money kept, but it weighs on you.' })},
  bonus:{ jar:'save', art:'gift', short:'Weekend trip', title:'A ₹3,000 referral bonus lands with your salary.', body:'Money you didn’t plan for.', choices:C3(
    { t:'Put it all in Save', income:{ to:'save', amount:3000 }, happy:2, line:'Your cushion just grew fast.' },
    { t:'Half to Save, half to Wants', income:{ split:true, amount:3000 }, happy:5, line:'A bit of both. Very balanced.' },
    { t:'Weekend trip with friends', income:{ to:'wants', amount:3000 }, kind:'want', cost:3000, happy:14, line:'A great weekend. The ₹3,000 is gone.' })},
  side:{ jar:'save', art:'coins', title:'A weekend freelance project pays ₹4,000.', body:'It would take both Saturdays this month.', choices:C3(
    { t:'Take it', income:{ to:'save', amount:4000 }, happy:-6, line:'₹4,000 earned. Watch you don’t burn out.' },
    { t:'Take half the work, ₹2,000', income:{ to:'save', amount:2000 }, happy:-2, line:'Extra money, one free weekend.' },
    { t:'Say no, rest instead', happy:3, line:'Rest is worth something too.' })},
  accounts:{ jar:'save', art:'jars3', title:'“Three accounts: one to earn, one to spend, one to grow.”', body:'A senior colleague explains her system. Salary lands in one account, then moves to the other two on payday.', choices:C3(
    { t:'Move ₹1,000 from Wants to Save', move:{ from:'wants', to:'save', amount:1000 }, line:'Paid yourself again. That’s the system working.' },
    { t:'Move ₹500 from Wants to Save', move:{ from:'wants', to:'save', amount:500 }, line:'Small, but it’s the habit that counts.' },
    { t:'Nice idea. Not today.', line:'Fair. The idea comes back at the end of the month.' })},
  kyc:{ jar:'save', art:'alert', title:'SMS: “Your KYC expires today. Click to update or your account is blocked.”', body:'It looks like it’s from your bank.', choices:C3(
    { t:'Click and enter your details', kind:'scam', cost:2000, happy:-10, line:'It was a fake page. Banks never ask for details over SMS links.' },
    { t:'Delete it', line:'Right call. Urgent links are a classic trick.' },
    { t:'Call the number on your bank card', happy:2, line:'Even better. Your KYC was fine.' })},
  stomach:{ jar:'needs', art:'thermo', title:'Street food gave you food poisoning.', body:'You feel awful and have work tomorrow.', choices:C3(
    { t:'See a doctor', kind:'need', cost:900, line:'Back on your feet. Needs covered it.' },
    { t:'Pharmacy medicine only', kind:'need', cost:300, happy:-4, line:'Cheaper. A rough couple of days.' },
    { t:'Ignore it', skipNeed:true, later:'stomach2', line:'Hope it passes.' })},
  stomach2:{ jar:'needs', art:'thermo', title:'You’re worse. The doctor wants tests too.', body:'Doctor, tests and medicine: ₹1,800.', choices:C3(
    { t:'Do it all', kind:'need', cost:1800, line:'A ₹900 problem became an ₹1,800 one.' },
    { t:'Government hospital, long wait', kind:'need', cost:400, happy:-6, line:'Cheaper, but a lost day off.' },
    { t:'Rest it out', happy:-12, line:'No spend. A miserable week.' })},
  battery:{ jar:'needs', art:'phonecrack', title:'Your phone battery dies by lunch every day.', body:'You need it for work calls.', choices:C3(
    { t:'Replace it at the service centre', kind:'need', cost:1500, line:'Like new. Needs covered it.' },
    { t:'Local shop replacement', kind:'need', cost:700, line:'Cheaper. Works for now.' },
    { t:'Carry your old power bank', happy:-4, line:'No spend. One more thing in your bag.' })},
  sangeet:{ jar:'happy', art:'cake', short:'Friend’s sangeet', title:'Your close friend’s sangeet. Outfit and gift: ₹2,500.', body:'Everyone from college will be there.', choices:C3(
    { t:'Go all in', kind:'want', cost:2500, happy:12, line:'Worth it. You’ll remember this one.' },
    { t:'Rent an outfit, smaller gift', kind:'want', cost:1200, happy:8, line:'You showed up, and spent half.' },
    { t:'Skip it', happy:-8, skipFriends:true, line:'Money kept, but you missed a big night.' })},
  offsite:{ jar:'happy', art:'mountain', short:'Team offsite', title:'Team offsite in the hills. Adventure activities cost ₹3,500 extra.', body:'Travel and stay are paid by the company.', choices:C3(
    { t:'Do all the activities', kind:'want', cost:3500, happy:14, line:'Rafting and ziplines. Wants paid for it.' },
    { t:'Pick one activity, ₹1,000', kind:'want', cost:1000, happy:9, line:'The best one, for less.' },
    { t:'Go, skip the activities', happy:2, line:'Free trip, and the view was free too.' })},
},
};

/* ---------- Book ideas: one concept per card, picked from how the player actually played ----------
   Only books from the Taily book list. Summaries in Taily’s own words, no quotes. */
const BOOKC = {
  rupee_save:{ book:'Rupee Tales: Anu learns to save', author:'Karthik Rangappa · Zerodha Varsity Junior', concept:'Saving now builds security later',
    summary:'A short story for young readers about a child who starts putting a little money aside. Small amounts, saved regularly, become something useful when a need shows up.',
    takeaway:'Next month, set aside your target on day one, before the canteen gets any of it.' },
  piggy_budget:{ book:'Piggy Bank to Portfolio', author:'Binal Gandhi & Soneera Sanghvi', concept:'A budget doesn’t refill when it runs out',
    summary:'The book answers real children’s money questions. One idea runs through it: a fixed amount has to last the whole month, so plan for the things that will definitely come up.',
    takeaway:'Keep a little in Needs for surprises, and pay small needs straight away.' },
  piggy_spread:{ book:'Piggy Bank to Portfolio', author:'Binal Gandhi & Soneera Sanghvi', concept:'Don’t put all your eggs in one basket',
    summary:'The book walks through how saving grows into investing. One simple rule: spread your money out, so one bad choice can’t wipe out everything.',
    takeaway:'Keep most of your money in Steady and Market, and only a small part in the Hot tip.' },
  myfirst_pin:{ book:'My First Book of Money', author:'Ravi Subramanian & Shoma Narayanan', concept:'Digital money needs care',
    summary:'Twins learn about money from their grandparents, including how paying by phone works. The big rule: a PIN is only for sending money, never for receiving it.',
    takeaway:'Never type a PIN or OTP for a request you didn’t start.' },
  rupee_share:{ book:'Rupee Tales: The cake shop', author:'Karthik Rangappa · Zerodha Varsity Junior', concept:'A share is a slice of a business',
    summary:'A story that explains shares with a cake shop. Owning a share means owning a small slice of a business, and its value rises and falls with how the business does.',
    takeaway:'The Market stall is lots of small slices of many businesses. One bad slice won’t sink it.' },
  babylon_save:{ book:'The Richest Man in Babylon', author:'George S. Clason · 1926', concept:'Keep a part of all you earn',
    summary:'Short parables set in ancient Babylon. The first and best-known rule: from everything you earn, keep at least one part in ten for yourself before paying anyone else.',
    takeaway:'Set aside first, even if it’s less than your target. The habit matters more than the amount.' },
  babylon_guard:{ book:'The Richest Man in Babylon', author:'George S. Clason · 1926', concept:'Guard your savings from loss',
    summary:'The book warns that savings are lost most easily to schemes that promise big, quick gains. Only put money where you understand what could go wrong.',
    takeaway:'If someone rushes you, or a prize asks you to pay, pause and check.' },
  auto_first:{ book:'The Automatic Millionaire', author:'David Bach', concept:'Pay yourself first, automatically',
    summary:'An ordinary couple builds wealth on an ordinary income. Their trick isn’t willpower: savings leave on payday, before there’s a chance to spend them.',
    takeaway:'Treat your set-aside like a bill that always gets paid first.' },
  auto_debt:{ book:'The Automatic Millionaire', author:'David Bach', concept:'Avoid carrying debt',
    summary:'Bach shows how small monthly payments quietly eat into future income. Paying later usually means paying more, and next month starts smaller.',
    takeaway:'If you can’t pay for it now, wishlist it for a month.' },
  auto_latte:{ book:'The Automatic Millionaire', author:'David Bach', concept:'Small daily spends add up',
    summary:'Bach’s famous example: a small daily treat looks harmless, but over a month or a year it becomes a big number. The point isn’t to cut every treat, it’s to notice them.',
    takeaway:'Pick one small habit to watch next month and see what it adds up to.' },
  psych_enough:{ book:'The Psychology of Money', author:'Morgan Housel', concept:'Spending to impress rarely works',
    summary:'Housel notes that people notice the thing you bought, not you. Buying to keep up rarely brings the respect or happiness it promises. Knowing what’s enough does.',
    takeaway:'Before a want, ask: would I still buy this if nobody saw it?' },
  psych_patience:{ book:'The Psychology of Money', author:'Morgan Housel', concept:'Patience beats cleverness',
    summary:'Housel argues that how you behave matters more than how clever you are. Most long-term gains come from staying invested through bad patches, not from timing them.',
    takeaway:'When the market drops, the first move is to do nothing.' },
  psych_luck:{ book:'The Psychology of Money', author:'Morgan Housel', concept:'Luck and risk',
    summary:'Results depend partly on things nobody controls. A win from a risky bet can be luck. A loss after a careful choice can be bad luck. Judge the decision, not just the result.',
    takeaway:'Keep risky bets small enough that losing them wouldn’t hurt.' },
  halan_emergency:{ book:'Let’s Talk Money', author:'Monika Halan', concept:'Keep an emergency fund',
    summary:'Halan suggests keeping a few months of expenses aside before investing. It stops a broken phone or a doctor’s bill from turning into debt.',
    takeaway:'Keep Needs topped up. Skipped needs usually come back bigger.' },
  halan_three:{ book:'Let’s Talk Money', author:'Monika Halan', concept:'Three accounts',
    summary:'Income lands in one account, then moves to a spending account and an investing account. Saving happens by design, before spending.',
    takeaway:'Split your money on day one: spend, save, grow.' },
  richdad_assets:{ book:'Rich Dad Poor Dad', author:'Robert Kiyosaki', concept:'Assets vs liabilities',
    summary:'Two father figures with opposite money beliefs. The useful idea: some things put money in your pocket (assets), others keep taking money out (liabilities).',
    takeaway:'Before a big buy, ask whether it will earn for you or only cost you.' },
};

/* ---------- The Bazaar ----------
   Earned by saving: open in any month you save your full monthly amount, unless your savings are running low
   (less than one month's target in Save). Half of Save always stays as a cushion. Returns are illustrative. */
const BZ = {
  keepShare: 0.5, steadyRate: 0.006,   // half of Save always stays as a cushion
  dice: { 1:0.4, 2:0.7, 3:0.9, 4:1.1, 5:1.4, 6:1.9 },   // Hot tip: rolled every month it holds money
  events: {
    calm:{ art:'news', title:'A quiet month in the markets.', body:'No big news. Prices drift up a little.', drop:0, after:{ market:0.015 },
      what:'A calm month. The Market stall drifted up 1.5%.',
      options:[ { t:'Hold. Change nothing', act:'none', q:'sound' }, { t:'Move 20% of Steady into Market', act:'addMarket', q:'sound' }, { t:'Move the Hot tip into Steady', act:'tipOut', q:'cautious' } ] },
    tip:{ art:'tip', title:'A friend swears a new coin will double this month.', body:'“Everyone’s getting in. Don’t miss it.”', drop:0, after:{ market:0.02 },
      what:'The Market stall rose 2%. The Hot tip was a dice roll, as always.',
      options:[ { t:'Put 20% of Steady into the Hot tip', act:'tipIn', q:'risky' }, { t:'Ignore it', act:'none', q:'sound' }, { t:'Cash out the Hot tip into Steady', act:'tipOut', q:'cautious' } ] },
    crash:{ art:'crash', title:'Market crash: the index falls 15% on global worries.', body:'Your Market stall already shows the drop. Everyone is panicking.', drop:-0.15, after:{ market:-0.01 },
      what:'The index fell 15% and slipped a little more by month end.', next:'rebound',
      options:[ { t:'Hold. Don’t touch it', act:'none', q:'sound' }, { t:'Sell everything in Market', act:'sellMarket', q:'panic' }, { t:'Add 20% of Steady while prices are low', act:'addMarket', q:'sound' } ] },
    rebound:{ art:'news', title:'Markets bounce back as worries fade.', body:'Last month’s fall is being recovered.', drop:0, after:{ market:0.13 },
      what:'The Market stall bounced back 13%.',
      options:[ { t:'Hold', act:'none', q:'sound' }, { t:'Move half of Market into Steady', act:'halfOut', q:'cautious' }, { t:'Add 20% of Steady to Market', act:'addMarket', q:'sound' } ] },
    boom:{ art:'news', title:'Big companies beat forecasts. Everyone’s talking about stocks.', body:'Your friends are moving everything into shares.', drop:0, after:{ market:0.06 },
      what:'The Market stall rose 6%.',
      options:[ { t:'Hold your plan', act:'none', q:'sound' }, { t:'Move all of Steady into Market', act:'allMarket', q:'risky' }, { t:'Move a quarter of Market into Steady', act:'quarterOut', q:'cautious' } ] },
    company:{ art:'news', title:'One big company in the index posts bad results. Its share falls 30%.', body:'Your index fund holds 50 companies.', drop:-0.02, after:{ market:0.01 },
      what:'Spread across 50 companies, your fund dipped 2%, then recovered a little.',
      options:[ { t:'Stay invested', act:'none', q:'sound' }, { t:'Sell the Market stall', act:'sellMarket', q:'panic' }, { t:'Move everything to Steady', act:'allSteady', q:'cautious' } ] },
    rates:{ art:'news', title:'The RBI raises interest rates.', body:'Deposits pay a bit more. Shares wobble.', drop:0, after:{ market:-0.03, steady:0.008 },
      what:'Higher rates nudged Steady up and the Market stall down 3%.',
      options:[ { t:'Hold', act:'none', q:'sound' }, { t:'Move Market into Steady', act:'sellMarket', q:'cautious' }, { t:'Add 20% of Steady to Market', act:'addMarket', q:'sound' } ] },
  },
  sequence: ['calm', 'tip', 'crash'],             // first Bazaar months (a crash is always followed by a rebound), then random
  random: ['boom', 'company', 'rates', 'tip', 'calm', 'crash'],
};
