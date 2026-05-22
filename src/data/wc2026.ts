export type StickerEntry = {
  number: number
  section: string
  team: string | null
  player_name: string | null
  rarity: 'common' | 'rare' | 'special' | 'foil'
}

export type FixtureMatch = {
  group: string
  team1: string
  team2: string
  date: string   // 'YYYY-MM-DD'
  venue: string
  city: string
}

export const ALBUM_ID = '00000000-0000-0000-0000-000000000001'
export const CC_OFFSET = 1000
export const CC_COUNT  = 14

// Grupos reales del Mundial 2026 (sorteo diciembre 2024)
export const WC2026_GROUPS: { group: string; teams: string[] }[] = [
  { group: 'A', teams: ['México',        'Sudáfrica',             'Corea del Sur',  'Chequia']              },
  { group: 'B', teams: ['Canadá',        'Bosnia y Herzegovina',  'Catar',          'Suiza']                },
  { group: 'C', teams: ['Brasil',        'Marruecos',             'Haití',          'Escocia']              },
  { group: 'D', teams: ['Estados Unidos','Paraguay',              'Australia',      'Türkiye']              },
  { group: 'E', teams: ['Alemania',      'Curazao',               'Costa de Marfil','Ecuador']              },
  { group: 'F', teams: ['Países Bajos',  'Japón',                 'Suecia',         'Túnez']                },
  { group: 'G', teams: ['Bélgica',       'Egipto',                'Irán',           'Nueva Zelanda']        },
  { group: 'H', teams: ['España',        'Cabo Verde',            'Arabia Saudita', 'Uruguay']              },
  { group: 'I', teams: ['Francia',       'Senegal',               'Irak',           'Noruega']              },
  { group: 'J', teams: ['Argentina',     'Argelia',               'Austria',        'Jordania']             },
  { group: 'K', teams: ['Portugal',      'Rep. Dem. del Congo',   'Uzbekistán',     'Colombia']             },
  { group: 'L', teams: ['Inglaterra',    'Croacia',               'Ghana',          'Panamá']               },
]

// Lista plana — el índice determina la numeración (team[i] → base = 20*(i+1))
export const WC2026_TEAMS: string[] = WC2026_GROUPS.flatMap(g => g.teams)

// 18 jugadores por equipo:
//   índices 0-10  → posiciones 2–12 (antes de la foto grupal)
//   índices 11-17 → posiciones 14–20 (después de la foto grupal)
const TEAM_PLAYERS: Record<string, string[]> = {
  // ── Grupo A ─────────────────────────────────────────────────────────────
  'México': [
    'L.Malagón','J.Vasquez','J.Sánchez','C.Montes','J.Gallardo','I.Reyes','D.Lainez','C.Rodriguez','E.Alvarez','O.Pineda','M.Ruiz',
    'É.Sánchez','H.Lozano','S.Giménez','R.Jiménez','A.Vega','R.Alvarado','C.Huerta',
  ],
  'Sudáfrica': [
    'Ronwen Williams','Sipho Chaine','Aubrey Modiba','Samukele Kabini','Mbekezeli Mbokazi','Khulumani Ndamane','Siyabonga Ngezana','Khuliso Mudau','Nkosinathi Sibisi','Teboho Mokoena','Thalente Mbatha',
    'Bathasi Aubaas','Yaya Sithole','Sipho Mbule','Lyle Foster','Iqraam Rayners','Mohau Nkota','Oswin Appollis',
  ],
  'Corea del Sur': [
    'Hyeon-woo Jo','Seung-Gyu Kim','Min-jae Kim','Yu-min Cho','Young-woo Seol','Han-beom Lee','Tae-seok Lee','Myung-jae Lee','Jae-sung Lee','In-beom Hwang','Kang-in Lee',
    'Seung-ho Paik','Jens Castrop','Dongg-yeong Lee','Gue-sung Cho','Heung-min Son','Hee-chan Hwang','Hyeon-Gyu Oh',
  ],
  'Chequia': [
    'Matej Kovar','Jindrich Stanek','Ladislav Krejci','Vladimir Coufal','Jaroslav Zeleny','Tomas Holes','David Zima','Michal Sadilek','Lukas Provod','Lukas Cerv','Tomas Soucek',
    'Pavel Sulc','Matej Vydra','Vasil Kusej','Tomas Chory','Vaclav Cerny','Adam Hlozek','Patrik Schick',
  ],
  // ── Grupo B ─────────────────────────────────────────────────────────────
  'Canadá': [
    'Dayne St.Clair','Alphonso Davies','Alistair Johnston','Samuel Adekugbe','Riche Larvea','Derek Cornelius','Moïse Bombito','Kamal Miller','Stephen Eustáquio','Ismaël Koné','Jonathan Osorio',
    'Jacob Shaffelburg','Mathieu Choinière','Niko Sigur','Tajon Buchanan','Liam Millar','Cyle Larin','Jonathan David',
  ],
  'Bosnia y Herzegovina': [
    'Nikola Vasilj','Amer Dedic','Sead Kolasinac','Tarik Muharemovic','Nihad Mujakic','Nikola Katic','Amir Hadziahmetovic','Benjamin Tahirovic','Armin Gigovic','Ivan Sunjic','Ivan Basic',
    'Dzenis Burnic','Esmir Bajraktarevic','Amar Memic','Ermedin Demirovic','Edin Dzeko','Samed Bazdar','Haris Tabakovic',
  ],
  'Catar': [
    'Meshaal Barsham','Sultan Albrake','Lucas Mendes','Homam Ahmed','Boualem Khoukhi','Pedro Miguel','Tarek Salman','Mohamed Al-Mannai','Karim Boudiaf','Assim Madibo','Ahmed Fatehi',
    'Mohammed Waad','Abdulaziz Hatem','Hassan Al-Haydos','Edmilson Junior','Akram Hassan Afif','Ahmed Al Ganehi','Almoez Ali',
  ],
  'Suiza': [
    'G.Kobel','Y.Mvogo','M.Akanji','R.Rodriguez','N.Elvedi','A.Amenda','S.Widmer','G.Xhaka','D.Zakaria','R.Freuler','F.Rieder',
    'A.Jashari','J.Manzambi','M.Aebischer','B.Embolo','R.Vargas','D.Ndoye','Z.Amdouni',
  ],
  // ── Grupo C ─────────────────────────────────────────────────────────────
  'Brasil': [
    'Alisson','Bento','Marquinhos','É.Militão','G.Magalhães','Danilo','Wesley','L.Paquetá','Casemiro','B.Guimarães','L.Henrique',
    'Vinicius Jr','Rodrygo','J.Pedro','M.Cunha','G.Martinelli','Raphinha','Estévão',
  ],
  'Marruecos': [
    'Yassine Bounou','Munir El Kajoui','Achraf Hakimi','Noussair Mazraoui','Nayef Aguerd','Roman Saiss','Jawad El Yamiq','Adam Masina','Sofyan Amrabat','Azzedine Ounahi','Eliesse Ben Seghir',
    'Bilal El Khannouss','Ismael Saibari','Youssef En-Nesyri','Abde Ezzalzouli','Soufiane Rahimi','Brahim Diaz','Ayoub El Kaabi',
  ],
  'Haití': [
    'Johny Placide','Carlens Arcus','Martin Expérience','Jean-Kevin Duverne','Ricardo Adé','Duke Lacroix','Garven Metusala','Hannes Delcroix','Leverton Pierre','Danley Jean Jacques','Jean-Ricner Bellegarde',
    'Christopher Attys','Derrick Etienne Jr','Josue Casimir','Ruben Providence','Duckens Nazon','Louicius Deedson','Frantzdy Pierrot',
  ],
  'Escocia': [
    'Angus Gunn','Jack Hendry','Kieran Tierney','Aaron Hickey','Andrew Robertson','Scott McKenna','John Souttar','Anthony Ralston','Grant Hanley','Scott McTominay','Billy Gilmour',
    'Lewis Ferguson','Ryan Christie','Kenny McLean','John McGinn','Lyndon Dykes','Che Adams','Ben Gannon-Doak',
  ],
  // ── Grupo D ─────────────────────────────────────────────────────────────
  'Estados Unidos': [
    'Matt Freese','Chris Richards','Tim Ream','Mark McKenzie','Alex Freeman','Antonee Robinson','Tyler Adams','Tanner Tessmann','Weston McKennie','Christian Roldan','Timothy Weah',
    'Diego Luna','Malik Tillman','Christian Pulisic','Brenden Aaronson','Ricardo Pepi','Haji Wright','Folarin Balogun',
  ],
  'Paraguay': [
    'Roberto Fernandez','Orlando Gill','Gustavo Gomez','Fabián Balbuena','Juan José Cáceres','Omar Alderete','Junior Alonso','Mathías Villasanti','Diego Gomez','Damián Bobadilla','Andres Cubas',
    'Matias Galarza','Julio Enciso','Alejandro Romero Gamarra','Miguel Almirón','Ramon Sosa','Angel Romero','Antonio Sanabria',
  ],
  'Australia': [
    'M.Ryan','J.Gauci','H.Souttar','A.Circati','J.Bos','A.Behich','C.Burgess','L.Miller','M.Degenek','J.Irvine','R.McGree',
    'A.O\'Neill','C.Metcalfe','P.Yazbek','C.Goodwin','K.Veng','N.Irankunda','M.Touré',
  ],
  'Türkiye': [
    'Ugurcan Cakir','Mert Muldur','Zeki Celik','Abdulkerim Bardakci','Caglar Soyuncu','Merih Demiral','Ferdi Kadioglu','Kaan Ayhan','Ismail Yuksek','Hakan Calhanoglu','Orkun Kokcu',
    'Arda Guler','Irfan Can Kahveci','Yunus Akgun','Can Uzun','Baris Alper Yilmaz','Kerem Akturkoglu','Kenan Yildiz',
  ],
  // ── Grupo E ─────────────────────────────────────────────────────────────
  'Alemania': [
    'ter Stegen','J.Tah','D.Raum','N.Schlotterbeck','A.Rüdiger','W.Anton','R.Baku','M.Mittelstadt','J.Kimmich','F.Wirtz','F.Nmecha',
    'L.Goretzka','J.Musiala','S.Gnabry','K.Havertz','L.Sané','K.Adeyemi','N.Woltemade',
  ],
  'Curazao': [
    'Eloy Room','Armando Obispo','Sherel Floranus','Jurien Gaari','Joshua Brenet','Roshon Van Eijma','Shurandy Sambo','Livano Comenencia','Godfried Roemeratoe','Juninho Bacuna','Leandro Bacuna',
    'Tahith Chong','Kenji Gorre','Jearl Margaritha','Jurgen Locadia','Jeremy Antonisse','Gervane Kastaneer','Sontje Hansen',
  ],
  'Costa de Marfil': [
    'Yahia Fofana','Ghislain Konan','Wilfried Singo','Odilon Kossounou','Evan Ndicka','Willy Boly','Emmanuel Agbadou','Ousmane Diomande','Franck Kessie','Seko Fofana','Ibrahim Sangare',
    'Jean-Philippe Gbamin','Amad Diallo','Sébastien Haller','Simon Adingra','Yan Diomande','Evann Guessand','Oumar Diakite',
  ],
  'Ecuador': [
    'Hernán Galíndez','Gonzalo Valle','Piero Hincapié','Pervis Estupiñán','Willian Pacho','Ángelo Preciado','Joel Ordóñez','Moises Caicedo','Alan Franco','Kendry Paez','Pedro Vite',
    'John Veboah','Leonardo Campana','Gonzalo Plata','Nilson Angulo','Alan Minda','Kevin Rodriguez','Enner Valencia',
  ],
  // ── Grupo F ─────────────────────────────────────────────────────────────
  'Países Bajos': [
    'B.Verbruggen','V.van Dijk','M.van de Ven','J.Timber','D.Dumfries','N.Aké','J.Frimpong','JP.van Hecke','T.Reijnders','R.Gravenberch','T.Koopmeiners',
    'F.de Jong','X.Simons','J.Kluivert','M.Depay','D.Malen','W.Weghorst','C.Gakpo',
  ],
  'Japón': [
    'Z.Suzuki','H.Mochizuki','A.Seko','J.Suzuki','S.Taniguchi','T.Watanabe','K.Sano','Y.Soma','A.Tanaka','D.Kamada','T.Kubo',
    'R.Doan','K.Nakamura','T.Minamino','S.Machino','J.Ito','K.Ogawa','A.Ueda',
  ],
  'Suecia': [
    'Victor Johansson','Isak Hien','Gabriel Gudmundsson','Emil Holm','Victor Nilsson Lindelöf','Gustaf Lagerbielke','Lucas Bergvall','Hugo Larsson','Jesper Karlström','Yasin Ayari','Mattias Svanberg',
    'Daniel Svensson','Ken Sema','Roony Bardghji','Dejan Kulusevski','Anthony Elanga','Alexander Isak','Viktor Gyökeres',
  ],
  'Túnez': [
    'Bechir Ben Said','Aymen Dahmen','Yan Valery','Montassar Talbi','Yassine Meriah','Ali Abdi','Dylan Bronn','Ellyes Skhiri','Aissa Laidouni','Ferjani Sassi','Mohamed Ali Ben Romdhane',
    'Hannibal Mejbri','Elias Achouri','Elias Saad','Hazem Mastouri','Ismael Gharbi','Sayfallah Ltaief','Naim Sliti',
  ],
  // ── Grupo G ─────────────────────────────────────────────────────────────
  'Bélgica': [
    'T.Courtois','A.Theate','T.Castagne','Z.Debast','B.Mechele','M.De Cuyper','T.Meunier','Y.Tielemans','A.Onana','N.Raskin','A.Saelemaekers',
    'H.Vanaken','K.De Bruyne','J.Doku','C.De Ketelaere','L.Trossard','L.Openda','R.Lukaku',
  ],
  'Egipto': [
    'Mohamed El Shenawy','Mohamed Hany','Mohamed Hamdy','Yasser Ibrahim','Khaled Sobhi','Ramy Rabia','Hossam Abdelmaguid','Ahmed Fatouh','Marwan Attia','Zizo','Hamdy Fathy',
    'Mohamed Lasheen','Emam Ashour','Osama Faisal','Mohamed Salah','Mostafa Mohamed','Trezeguet','Omar Marmoush',
  ],
  'Irán': [
    'Alireza Beiranvand','Morteza Pouraliganji','Ehsan Hajsafi','Milad Mohammadi','Shojae Khalilzadeh','Ramin Rezaeian','Hossein Kanaani','Sadegh Moharrami','Saleh Hardani','Saeed Ezatolahi','Saman Ghoddos',
    'Omid Noorafkan','Roozbeh Cheshmi','Mohammad Mohebi','Sardar Azmoun','Mehdi Taremi','Alireza Jahanbakhsh','Ali Gholizadeh',
  ],
  'Nueva Zelanda': [
    'Max Crocombe','Alex Paulsen','Michael Boxall','Liberato Cacace','Tim Payne','Tyler Bindon','Francis de Vries','Finn Surman','Joe Bell','Sarpreet Singh','Ryan Thomas',
    'Matthew Garbett','Marko Stamenić','Ben Old','Chris Wood','Elijah Just','Callum McCowatt','Kosta Barbarouses',
  ],
  // ── Grupo H ─────────────────────────────────────────────────────────────
  'España': [
    'U.Simon','R.Le Normand','A.Laporte','D.Huijsen','P.Porro','D.Carvajal','M.Cucurella','M.Zubimendi','Rodri','Pedri','F.Ruiz',
    'M.Merino','L.Yamal','D.Olmo','N.Williams','F.Torres','Á.Morata','M.Oyarzabal',
  ],
  'Cabo Verde': [
    'Vozinha','Logan Costa','Pico','Diney','Steven Moreira','Wagner Pina','Joao Paulo','Yannick Semedo','Kevin Pina','Patrick Andrade','Jamiro Monteiro',
    'Deroy Duarte','Garry Rodrigues','Jovane Cabral','Ryan Mendes','Dailon Livramento','Willy Semedo','Bebé',
  ],
  'Arabia Saudita': [
    'Nawaf Alaqidi','Abdulrahman Al-Sanbi','Saud Abdulhamid','Nawaf Bouwashl','Jihad Thakri','Moteb Al-Harbi','Hassan Altambakti','Musab Aljuwayr','Ziyad Aljohani','Abdullah Alkhaibari','Nasser Aldawsari',
    'Saleh Abu Alshamat','Marwan Alsahafi','Salem Aldawsari','Abdulrahman Al-Aboud','Feras Akbrikan','Saleh Alshehri','Abdullah Al-Hamdan',
  ],
  'Uruguay': [
    'S.Rochet','S.Mele','R.Araujo','JM.Giménez','S.Caceres','M.Olivera','G.Varela','N.Nandez','F.Valverde','G.De Arrascaeta','R.Bentancur',
    'M.Ugarte','N.de la Cruz','M.Araujo','D.Núñez','F.Viñas','R.Aguirre','F.Pellistri',
  ],
  // ── Grupo I ─────────────────────────────────────────────────────────────
  'Francia': [
    'M.Maignan','T.Hernandez','W.Saliba','J.Kounde','I.Konate','D.Upamecano','L.Digne','A.Tchouaméni','E.Camavinga','M.Kone','A.Rabiot',
    'M.Olise','O.Dembele','B.Barcola','D.Doué','K.Coman','H.Ekitike','K.Mbappé',
  ],
  'Senegal': [
    'E.Mendy','Y.Diouf','M.Niakhaté','A.Seck','I.Jakobs','EH.Diouf','K.Koulibaly','IG.Gueye','PM.Sarr','P.Gueye','H.Diarra',
    'L.Camara','S.Mané','I.Sarr','B.Dia','I.Ndiaye','N.Jackson','K.Diatta',
  ],
  'Irak': [
    'Jalal Hassan','Rebin Sulaka','Hussein Ali','Akam Hashem','Merchas Doski','Zaid Tahseen','Manaf Younis','Zidane Iqbal','Amir Al-Ammari','Ibrahim Bavesh','Ali Jasim',
    'Youssef Amyn','Aimar Sher','Marko Farji','Osama Rashid','Ali Al-Hamadi','Aymen Hussein','Mohanad Ali',
  ],
  'Noruega': [
    'Orjan Nyland','Julian Ryerson','Leo Ostigård','Kristoffer Ajer','Marcus Holmgren Pedersen','David Møller Wolfe','Torbjørn Heggem','Morten Thorsby','Martin Ødegaard','Sander Berge','Andreas Schjelderup',
    'Patrick Berg','Erling Haaland','Alexander Sørloth','Aron Dønnum','Jorgen Strand Larsen','Antonio Nusa','Oscar Bobb',
  ],
  // ── Grupo J ─────────────────────────────────────────────────────────────
  'Argentina': [
    'E.Martínez','N.Molina','C.Romero','N.Otamendi','N.Tagliafico','L.Balerdi','E.Fernandez','A.Mac Allister','R.De Paul','E.Palacios','L.Paredes',
    'N.Paz','F.Mastantuono','N.Gonzalez','L.Messi','L.Martínez','J.Alvarez','G.Simeone',
  ],
  'Argelia': [
    'Alexis Guendouz','Ramy Bensebaini','Youcef Atal','Rayan Aït-Nouri','Mohamed Amine Tougai','Aïssa Mandi','Ismael Bennacer','Houssem Aquar','Hicham Boudaoui','Ramiz Zerrouki','Nabil Bentalab',
    'Farés Chaibi','Riyad Mahrez','Said Benrahma','Anis Hadj Moussa','Amine Gouiri','Baghdad Bounedjah','Mohammed Amoura',
  ],
  'Austria': [
    'Alexander Schlager','Patrick Pentz','David Alaba','Kevin Danso','Philipp Lienhart','Stefan Posch','Phillipp Mwene','Alexander Prass','Xaver Schlager','Marcel Sabitzer','Konrad Laimer',
    'Florian Grillitsch','Nicolas Seiwald','Romano Schmid','Patrick Wimmer','Christoph Baumgartner','Michael Gregoritsch','Marko Arnautović',
  ],
  'Jordania': [
    'Yazeed Abulaila','Ihsan Haddad','Mohammad Abu Hashish','Yazan Al-Arab','Abdallah Nasib','Saleem Obaid','Mohammad Abualnadi','Ibrahim Saadeh','Nizar Al-Rashdan','Noor Al-Rawabdeh','Mohannad Abu Taha',
    'Amer Jamous','Musa Al-Taamari','Yazan Al-Naimat','Mahmoud Al-Mardi','Ali Olwan','Mohammad Abu Zrayq','Ibrahim Sabra',
  ],
  // ── Grupo K ─────────────────────────────────────────────────────────────
  'Portugal': [
    'D.Costa','Jose Sá','R.Dias','J.Cancelo','D.Dalot','N.Mendes','G.Inácio','B.Silva','B.Fernandes','R.Neves','Vitinha',
    'J.Neves','C.Ronaldo','F.Trincão','J.Félix','G.Ramos','P.Neto','R.Leão',
  ],
  'Rep. Dem. del Congo': [
    'Lionel Mpasi','Aaron Wan-Bissaka','Axel Tuanzebe','Arthur Masuaku','Chancel Mbemba','Joris Kayembe','Charles Pickel','Ngal\'ayel Mukau','Edo Kayembe','Samuel Moutoussamy','Noah Sadiki',
    'Théo Bongonda','Meschak Elia','Yoane Wissa','Brian Cipenga','Fiston Mayele','Cédric Bakambu','Nathanaël Mbuku',
  ],
  'Uzbekistán': [
    'Utkir Yusupov','Farrukh Savfiev','Sherzod Nasrullaev','Umar Eshmurodov','Husniddin Aliqulov','Rustamjon Ashurmatov','Khojiakbar Alijonov','Abdukodir Khusanov','Odiljon Hamrobekov','Otabek Shukurov','Jamshid Iskanderov',
    'Azizbek Turgunboev','Khojimat Erkinov','Eldor Shomurodov','Oston Urunov','Jaloliddin Masharipov','Igor Sergeev','Abbosbek Fayzullaev',
  ],
  'Colombia': [
    'C.Vargas','D.Ospina','D.Sánchez','Y.Mina','D.Munoz','J.Mojica','J.Lucumí','S.Arias','J.Lerma','K.Castaño','R.Rios',
    'J.Rodriguez','JF.Quintero','J.Carrascal','J.Arias','J.Cordova','L.Suarez','L.Diaz',
  ],
  // ── Grupo L ─────────────────────────────────────────────────────────────
  'Inglaterra': [
    'J.Pickford','J.Stones','M.Guéhi','E.Konsa','T.Alexander-Arnold','R.James','D.Burn','J.Henderson','D.Rice','J.Bellingham','C.Palmer',
    'M.Rogers','A.Gordon','P.Foden','B.Saka','H.Kane','M.Rashford','O.Watkins',
  ],
  'Croacia': [
    'D.Livaković','D.Caleta-Car','J.Gvardiol','J.Stanišić','L.Vušković','J.Sutalo','K.Jakic','L.Modrić','M.Kovacic','M.Baturina','L.Majer',
    'M.Pasalic','P.Sucic','I.Perišić','A.Budimir','A.Kramarić','F.Ivanovic','B.Sosa',
  ],
  'Ghana': [
    'Lawrence Ati Zigi','Tariq Lamptey','Mohammed Salisu','Alidu Seidu','Alexander Djiku','Gideon Mensah','Caleb Yirenkyi','Abdul Issahaku Fatawu','Thomas Partey','Salis Abdul Samed','Kamaldeen Sulemana',
    'Mohammed Kudus','Inaki Williams','Jordan Ayew','Andrew Ayew','Joseph Paintsil','Osman Bukari','Antoine Semenyo',
  ],
  'Panamá': [
    'Orlando Mosquera','Luis Mejia','Fidel Escobar','Andres Andrade','Michael Amir Murillo','Eric Davis','Jose Cordoba','Cesar Blackman','Cristian Martinez','Aníbal Godoy','Adalberto Carrasquilla',
    'Édgar Bárcenas','Carlos Harvey','Ismael Díaz','Jose Fajardo','Cecilio Waterman','Jose Luiz Rodriguez','Alberto Quintero',
  ],
}

const FWC_ITEMS: { name: string; rarity: StickerEntry['rarity'] }[] = [
  { name: 'Panini Logo',                rarity: 'foil'    }, // 00
  { name: 'Emblema Oficial 1/2',        rarity: 'foil'    }, // 01
  { name: 'Emblema Oficial 2/2',        rarity: 'foil'    }, // 02
  { name: 'Mascotas Oficiales',         rarity: 'special' }, // 03
  { name: 'Eslogan Oficial',            rarity: 'common'  }, // 04
  { name: 'Balón Oficial',             rarity: 'special' }, // 05
  { name: 'Canadá (Sede)',              rarity: 'common'  }, // 06
  { name: 'México (Sede)',              rarity: 'common'  }, // 07
  { name: 'Estados Unidos (Sede)',      rarity: 'common'  }, // 08
  { name: 'Foto Equipo Italia 1934',    rarity: 'common'  }, // 09
  { name: 'Foto Equipo Uruguay 1950',   rarity: 'common'  }, // 10
  { name: 'Foto Equipo Alemania 1954',  rarity: 'common'  }, // 11
  { name: 'Foto Equipo Brasil 1962',    rarity: 'common'  }, // 12
  { name: 'Foto Equipo Alemania 1974',  rarity: 'common'  }, // 13
  { name: 'Foto Equipo Argentina 1986', rarity: 'special' }, // 14
  { name: 'Foto Equipo Brasil 1994',    rarity: 'common'  }, // 15
  { name: 'Foto Equipo Brasil 2002',    rarity: 'common'  }, // 16
  { name: 'Foto Equipo Italia 2006',    rarity: 'common'  }, // 17
  { name: 'Foto Equipo Alemania 2014',  rarity: 'common'  }, // 18
  { name: 'Foto Equipo Argentina 2022', rarity: 'special' }, // 19
]

export function generateStickers(): StickerEntry[] {
  const stickers: StickerEntry[] = []

  // 00–19: FWC especiales
  FWC_ITEMS.forEach(({ name, rarity }, i) => {
    stickers.push({ number: i, section: 'FWC', team: null, player_name: name, rarity })
  })

  // 20–979: 48 selecciones × 20 figuritas
  // Estructura: Logo(foil) | Jugadores 1-11 | Foto Grupal(special) | Jugadores 12-18
  WC2026_TEAMS.forEach((team, teamIdx) => {
    const base    = 20 * (teamIdx + 1)
    const players = TEAM_PLAYERS[team] ?? Array.from({ length: 18 }, (_, i) => `Jugador ${i + 1}`)

    stickers.push({ number: base, section: team, team, player_name: `Escudo ${team}`, rarity: 'foil' })

    for (let p = 0; p < 11; p++) {
      stickers.push({
        number:      base + 1 + p,
        section:     team,
        team,
        player_name: players[p] ?? `Jugador ${p + 1}`,
        rarity:      p === 0 ? 'special' : 'common',
      })
    }

    stickers.push({ number: base + 12, section: team, team, player_name: 'Foto Grupal', rarity: 'special' })

    for (let p = 11; p < 18; p++) {
      stickers.push({
        number:      base + 2 + p,
        section:     team,
        team,
        player_name: players[p] ?? `Jugador ${p + 1}`,
        rarity:      'common',
      })
    }
  })

  // 1001–1014: Coca-Cola
  for (let i = 1; i <= CC_COUNT; i++) {
    stickers.push({
      number:      CC_OFFSET + i,
      section:     'Coca-Cola',
      team:        null,
      player_name: `Coca-Cola ${i}`,
      rarity:      i <= 3 ? 'foil' : 'special',
    })
  }

  return stickers
}

export const ALL_STICKERS   = generateStickers()
export const TOTAL_STICKERS = 980
export const TOTAL_WITH_CC  = 980 + CC_COUNT

export function getTeamGroup(team: string): string | null {
  return WC2026_GROUPS.find(g => g.teams.includes(team))?.group ?? null
}

// ── Fixture: fase de grupos completa ─────────────────────────────────────
export const FIXTURE: FixtureMatch[] = [
  // Grupo A
  { group:'A', team1:'México',        team2:'Sudáfrica',           date:'2026-06-11', venue:'Estadio Azteca',              city:'Ciudad de México' },
  { group:'A', team1:'Corea del Sur', team2:'Chequia',             date:'2026-06-11', venue:'Estadio Akron',               city:'Zapopan'          },
  { group:'A', team1:'Chequia',       team2:'Sudáfrica',           date:'2026-06-18', venue:'Mercedes-Benz Stadium',       city:'Atlanta'          },
  { group:'A', team1:'México',        team2:'Corea del Sur',       date:'2026-06-18', venue:'Estadio Akron',               city:'Zapopan'          },
  { group:'A', team1:'Chequia',       team2:'México',              date:'2026-06-24', venue:'Estadio Azteca',              city:'Ciudad de México' },
  { group:'A', team1:'Sudáfrica',     team2:'Corea del Sur',       date:'2026-06-24', venue:'Estadio BBVA',                city:'Guadalupe'        },
  // Grupo B
  { group:'B', team1:'Canadá',                 team2:'Bosnia y Herzegovina', date:'2026-06-12', venue:'BMO Field',          city:'Toronto'      },
  { group:'B', team1:'Catar',                  team2:'Suiza',                date:'2026-06-13', venue:'Levi\'s Stadium',    city:'Santa Clara'  },
  { group:'B', team1:'Suiza',                  team2:'Bosnia y Herzegovina', date:'2026-06-18', venue:'SoFi Stadium',       city:'Los Ángeles'  },
  { group:'B', team1:'Canadá',                 team2:'Catar',                date:'2026-06-18', venue:'BC Place',           city:'Vancouver'    },
  { group:'B', team1:'Suiza',                  team2:'Canadá',               date:'2026-06-24', venue:'BC Place',           city:'Vancouver'    },
  { group:'B', team1:'Bosnia y Herzegovina',   team2:'Catar',                date:'2026-06-24', venue:'Lumen Field',        city:'Seattle'      },
  // Grupo C
  { group:'C', team1:'Brasil',    team2:'Marruecos', date:'2026-06-13', venue:'MetLife Stadium',           city:'East Rutherford' },
  { group:'C', team1:'Haití',     team2:'Escocia',   date:'2026-06-13', venue:'Gillette Stadium',          city:'Foxborough'      },
  { group:'C', team1:'Escocia',   team2:'Marruecos', date:'2026-06-19', venue:'Gillette Stadium',          city:'Foxborough'      },
  { group:'C', team1:'Brasil',    team2:'Haití',     date:'2026-06-19', venue:'Lincoln Financial Field',   city:'Filadelfia'      },
  { group:'C', team1:'Escocia',   team2:'Brasil',    date:'2026-06-24', venue:'Hard Rock Stadium',         city:'Miami Gardens'   },
  { group:'C', team1:'Marruecos', team2:'Haití',     date:'2026-06-24', venue:'Mercedes-Benz Stadium',    city:'Atlanta'         },
  // Grupo D
  { group:'D', team1:'Estados Unidos', team2:'Paraguay',   date:'2026-06-12', venue:'SoFi Stadium',      city:'Los Ángeles'  },
  { group:'D', team1:'Australia',      team2:'Türkiye',    date:'2026-06-13', venue:'BC Place',          city:'Vancouver'    },
  { group:'D', team1:'Estados Unidos', team2:'Australia',  date:'2026-06-19', venue:'Lumen Field',       city:'Seattle'      },
  { group:'D', team1:'Türkiye',        team2:'Paraguay',   date:'2026-06-19', venue:'Levi\'s Stadium',   city:'Santa Clara'  },
  { group:'D', team1:'Türkiye',        team2:'Estados Unidos', date:'2026-06-25', venue:'SoFi Stadium',  city:'Los Ángeles'  },
  { group:'D', team1:'Paraguay',       team2:'Australia',  date:'2026-06-25', venue:'Levi\'s Stadium',   city:'Santa Clara'  },
  // Grupo E
  { group:'E', team1:'Alemania',       team2:'Curazao',        date:'2026-06-14', venue:'NRG Stadium',               city:'Houston'        },
  { group:'E', team1:'Costa de Marfil',team2:'Ecuador',        date:'2026-06-14', venue:'Lincoln Financial Field',   city:'Filadelfia'     },
  { group:'E', team1:'Alemania',       team2:'Costa de Marfil',date:'2026-06-20', venue:'BMO Field',                 city:'Toronto'        },
  { group:'E', team1:'Ecuador',        team2:'Curazao',        date:'2026-06-20', venue:'Arrowhead Stadium',         city:'Kansas City'    },
  { group:'E', team1:'Curazao',        team2:'Costa de Marfil',date:'2026-06-25', venue:'Lincoln Financial Field',   city:'Filadelfia'     },
  { group:'E', team1:'Ecuador',        team2:'Alemania',       date:'2026-06-25', venue:'MetLife Stadium',           city:'East Rutherford'},
  // Grupo F
  { group:'F', team1:'Países Bajos', team2:'Japón',         date:'2026-06-14', venue:'AT&T Stadium',      city:'Arlington'    },
  { group:'F', team1:'Suecia',       team2:'Túnez',         date:'2026-06-14', venue:'Estadio BBVA',      city:'Guadalupe'    },
  { group:'F', team1:'Países Bajos', team2:'Suecia',        date:'2026-06-20', venue:'NRG Stadium',       city:'Houston'      },
  { group:'F', team1:'Túnez',        team2:'Japón',         date:'2026-06-20', venue:'Estadio BBVA',      city:'Guadalupe'    },
  { group:'F', team1:'Japón',        team2:'Suecia',        date:'2026-06-25', venue:'AT&T Stadium',      city:'Arlington'    },
  { group:'F', team1:'Túnez',        team2:'Países Bajos',  date:'2026-06-25', venue:'Arrowhead Stadium', city:'Kansas City'  },
  // Grupo G
  { group:'G', team1:'Bélgica',       team2:'Egipto',        date:'2026-06-15', venue:'Lumen Field', city:'Seattle'    },
  { group:'G', team1:'Irán',          team2:'Nueva Zelanda', date:'2026-06-15', venue:'SoFi Stadium',city:'Los Ángeles'},
  { group:'G', team1:'Bélgica',       team2:'Irán',          date:'2026-06-21', venue:'SoFi Stadium',city:'Los Ángeles'},
  { group:'G', team1:'Nueva Zelanda', team2:'Egipto',        date:'2026-06-21', venue:'BC Place',    city:'Vancouver'  },
  { group:'G', team1:'Egipto',        team2:'Irán',          date:'2026-06-26', venue:'Lumen Field', city:'Seattle'    },
  { group:'G', team1:'Nueva Zelanda', team2:'Bélgica',       date:'2026-06-26', venue:'BC Place',    city:'Vancouver'  },
  // Grupo H
  { group:'H', team1:'España',         team2:'Cabo Verde',    date:'2026-06-15', venue:'Mercedes-Benz Stadium', city:'Atlanta'       },
  { group:'H', team1:'Arabia Saudita', team2:'Uruguay',       date:'2026-06-15', venue:'Hard Rock Stadium',     city:'Miami Gardens' },
  { group:'H', team1:'España',         team2:'Arabia Saudita',date:'2026-06-21', venue:'Mercedes-Benz Stadium', city:'Atlanta'       },
  { group:'H', team1:'Uruguay',        team2:'Cabo Verde',    date:'2026-06-21', venue:'Hard Rock Stadium',     city:'Miami Gardens' },
  { group:'H', team1:'Cabo Verde',     team2:'Arabia Saudita',date:'2026-06-26', venue:'NRG Stadium',           city:'Houston'       },
  { group:'H', team1:'Uruguay',        team2:'España',        date:'2026-06-26', venue:'Estadio Akron',         city:'Zapopan'       },
  // Grupo I
  { group:'I', team1:'Francia',  team2:'Senegal', date:'2026-06-16', venue:'MetLife Stadium',         city:'East Rutherford' },
  { group:'I', team1:'Irak',     team2:'Noruega', date:'2026-06-16', venue:'Gillette Stadium',        city:'Foxborough'      },
  { group:'I', team1:'Francia',  team2:'Irak',    date:'2026-06-22', venue:'Lincoln Financial Field', city:'Filadelfia'      },
  { group:'I', team1:'Noruega',  team2:'Senegal', date:'2026-06-22', venue:'MetLife Stadium',         city:'East Rutherford' },
  { group:'I', team1:'Noruega',  team2:'Francia', date:'2026-06-26', venue:'Gillette Stadium',        city:'Foxborough'      },
  { group:'I', team1:'Senegal',  team2:'Irak',    date:'2026-06-26', venue:'BMO Field',               city:'Toronto'         },
  // Grupo J
  { group:'J', team1:'Argentina', team2:'Argelia',  date:'2026-06-16', venue:'Arrowhead Stadium', city:'Kansas City' },
  { group:'J', team1:'Austria',   team2:'Jordania', date:'2026-06-16', venue:'Levi\'s Stadium',   city:'Santa Clara' },
  { group:'J', team1:'Argentina', team2:'Austria',  date:'2026-06-22', venue:'AT&T Stadium',      city:'Arlington'   },
  { group:'J', team1:'Jordania',  team2:'Argelia',  date:'2026-06-22', venue:'Levi\'s Stadium',   city:'Santa Clara' },
  { group:'J', team1:'Argelia',   team2:'Austria',  date:'2026-06-27', venue:'Arrowhead Stadium', city:'Kansas City' },
  { group:'J', team1:'Jordania',  team2:'Argentina',date:'2026-06-27', venue:'AT&T Stadium',      city:'Arlington'   },
  // Grupo K
  { group:'K', team1:'Portugal',             team2:'Rep. Dem. del Congo', date:'2026-06-17', venue:'NRG Stadium',           city:'Houston'       },
  { group:'K', team1:'Uzbekistán',           team2:'Colombia',            date:'2026-06-17', venue:'Estadio Azteca',        city:'Ciudad de México'},
  { group:'K', team1:'Portugal',             team2:'Uzbekistán',          date:'2026-06-23', venue:'NRG Stadium',           city:'Houston'       },
  { group:'K', team1:'Colombia',             team2:'Rep. Dem. del Congo', date:'2026-06-23', venue:'Estadio Akron',         city:'Zapopan'       },
  { group:'K', team1:'Colombia',             team2:'Portugal',            date:'2026-06-27', venue:'Hard Rock Stadium',     city:'Miami Gardens' },
  { group:'K', team1:'Rep. Dem. del Congo',  team2:'Uzbekistán',          date:'2026-06-27', venue:'Mercedes-Benz Stadium', city:'Atlanta'       },
  // Grupo L
  { group:'L', team1:'Inglaterra', team2:'Croacia', date:'2026-06-17', venue:'AT&T Stadium',            city:'Arlington'   },
  { group:'L', team1:'Ghana',      team2:'Panamá',  date:'2026-06-17', venue:'BMO Field',               city:'Toronto'     },
  { group:'L', team1:'Inglaterra', team2:'Ghana',   date:'2026-06-23', venue:'Gillette Stadium',        city:'Foxborough'  },
  { group:'L', team1:'Panamá',     team2:'Croacia', date:'2026-06-23', venue:'BMO Field',               city:'Toronto'     },
  { group:'L', team1:'Panamá',     team2:'Inglaterra',date:'2026-06-27', venue:'MetLife Stadium',       city:'East Rutherford'},
  { group:'L', team1:'Croacia',    team2:'Ghana',   date:'2026-06-27', venue:'Lincoln Financial Field', city:'Filadelfia'  },
]
