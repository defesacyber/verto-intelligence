// Coordenadas de cidades brasileiras para o mapa interativo
// Formato: [longitude, latitude]
export const BRAZIL_CITY_COORDINATES: Record<string, [number, number]> = {
  // === CAPITAIS ===
  'São Paulo-SP': [-46.6333, -23.5505],
  'Rio de Janeiro-RJ': [-43.1729, -22.9068],
  'Belo Horizonte-MG': [-43.9378, -19.9167],
  'Brasília-DF': [-47.8825, -15.7942],
  'Salvador-BA': [-38.5014, -12.9714],
  'Fortaleza-CE': [-38.5267, -3.7172],
  'Curitiba-PR': [-49.2731, -25.4290],
  'Recife-PE': [-34.8813, -8.0476],
  'Porto Alegre-RS': [-51.2177, -30.0346],
  'Manaus-AM': [-60.0217, -3.1190],
  'Goiânia-GO': [-49.2647, -16.6869],
  'Florianópolis-SC': [-48.5482, -27.5954],
  'Vitória-ES': [-40.2976, -20.3155],
  'Natal-RN': [-35.2094, -5.7945],
  'João Pessoa-PB': [-34.8631, -7.1195],
  'Maceió-AL': [-35.7353, -9.6658],
  'Aracaju-SE': [-37.0731, -10.9472],
  'Teresina-PI': [-42.8019, -5.0892],
  'São Luís-MA': [-44.2826, -2.5307],
  'Cuiabá-MT': [-56.0974, -15.5989],
  'Campo Grande-MS': [-54.6462, -20.4697],
  'Belém-PA': [-48.5044, -1.4558],
  'Porto Velho-RO': [-63.9039, -8.7612],
  'Boa Vista-RR': [-60.6758, 2.8235],
  'Macapá-AP': [-51.0669, 0.0356],
  'Rio Branco-AC': [-67.8076, -9.9754],
  'Palmas-TO': [-48.3558, -10.2128],
  
  // === SÃO PAULO ===
  'Guarulhos-SP': [-46.5333, -23.4628],
  'Campinas-SP': [-47.0608, -22.9056],
  'São Bernardo do Campo-SP': [-46.5646, -23.6914],
  'Santo André-SP': [-46.5322, -23.6666],
  'Osasco-SP': [-46.7917, -23.5325],
  'Ribeirão Preto-SP': [-47.8103, -21.1775],
  'Sorocaba-SP': [-47.4558, -23.5015],
  'São José dos Campos-SP': [-45.8869, -23.1896],
  'Santos-SP': [-46.3289, -23.9608],
  'Mauá-SP': [-46.4617, -23.6678],
  'Diadema-SP': [-46.6228, -23.6814],
  'Carapicuíba-SP': [-46.8358, -23.5225],
  'Piracicaba-SP': [-47.6492, -22.7256],
  'Bauru-SP': [-49.0606, -22.3147],
  'Jundiaí-SP': [-46.8842, -23.1864],
  'São José do Rio Preto-SP': [-49.3792, -20.8197],
  'Mogi das Cruzes-SP': [-46.1883, -23.5225],
  'Suzano-SP': [-46.3106, -23.5425],
  'Barueri-SP': [-46.8761, -23.5108],
  'Praia Grande-SP': [-46.4022, -24.0058],
  'São Vicente-SP': [-46.3933, -23.9631],
  'Guarujá-SP': [-46.2567, -23.9928],
  'Taubaté-SP': [-45.5558, -23.0225],
  'Limeira-SP': [-47.4017, -22.5644],
  'Franca-SP': [-47.4008, -20.5386],
  'Marília-SP': [-49.9458, -22.2139],
  'Presidente Prudente-SP': [-51.3889, -22.1256],
  'Araraquara-SP': [-48.1756, -21.7944],
  'São Carlos-SP': [-47.8906, -22.0178],
  'Americana-SP': [-47.3306, -22.7392],
  'Indaiatuba-SP': [-47.2181, -23.0906],
  'São Caetano do Sul-SP': [-46.5506, -23.6225],
  'Botucatu-SP': [-48.4450, -22.8861],
  'Valinhos-SP': [-46.9956, -22.9708],
  'Vinhedo-SP': [-46.9758, -23.0297],
  'Atibaia-SP': [-46.5506, -23.1172],
  'Cotia-SP': [-46.9192, -23.6039],
  
  // === RIO DE JANEIRO ===
  'São Gonçalo-RJ': [-43.0536, -22.8269],
  'Duque de Caxias-RJ': [-43.3117, -22.7858],
  'Nova Iguaçu-RJ': [-43.4511, -22.7556],
  'Niterói-RJ': [-43.1033, -22.8833],
  'Belford Roxo-RJ': [-43.3992, -22.7644],
  'Campos dos Goytacazes-RJ': [-41.3269, -21.7622],
  'Petrópolis-RJ': [-43.1822, -22.5047],
  'Volta Redonda-RJ': [-44.1044, -22.5231],
  'Macaé-RJ': [-41.7869, -22.3708],
  'Cabo Frio-RJ': [-42.0189, -22.8789],
  'Angra dos Reis-RJ': [-44.3181, -23.0067],
  'Teresópolis-RJ': [-42.9656, -22.4122],
  'Maricá-RJ': [-42.8189, -22.9186],
  'Rio das Ostras-RJ': [-41.9447, -22.5269],
  
  // === MINAS GERAIS ===
  'Uberlândia-MG': [-48.2772, -18.9186],
  'Contagem-MG': [-44.0539, -19.9319],
  'Juiz de Fora-MG': [-43.3503, -21.7642],
  'Betim-MG': [-44.1983, -19.9678],
  'Montes Claros-MG': [-43.8617, -16.7350],
  'Ribeirão das Neves-MG': [-44.0867, -19.7669],
  'Uberaba-MG': [-47.9317, -19.7478],
  'Governador Valadares-MG': [-41.9500, -18.8511],
  'Ipatinga-MG': [-42.5367, -19.4686],
  'Sete Lagoas-MG': [-44.2467, -19.4658],
  'Divinópolis-MG': [-44.8836, -20.1389],
  'Poços de Caldas-MG': [-46.5617, -21.7878],
  'Nova Lima-MG': [-43.8469, -19.9858],
  'Varginha-MG': [-45.4303, -21.5514],
  
  // === ESPÍRITO SANTO ===
  'Vila Velha-ES': [-40.2958, -20.3297],
  'Serra-ES': [-40.3078, -20.1286],
  'Cariacica-ES': [-40.4200, -20.2639],
  'Cachoeiro de Itapemirim-ES': [-41.1128, -20.8489],
  'Guarapari-ES': [-40.4997, -20.6733],
  
  // === PARANÁ ===
  'Londrina-PR': [-51.1628, -23.3103],
  'Maringá-PR': [-51.9386, -23.4206],
  'Ponta Grossa-PR': [-50.1617, -25.0950],
  'Cascavel-PR': [-53.4550, -24.9556],
  'São José dos Pinhais-PR': [-49.2064, -25.5350],
  'Foz do Iguaçu-PR': [-54.5858, -25.5478],
  
  // === RIO GRANDE DO SUL ===
  'Caxias do Sul-RS': [-51.1792, -29.1678],
  'Canoas-RS': [-51.1839, -29.9178],
  'Pelotas-RS': [-52.3428, -31.7719],
  'Santa Maria-RS': [-53.8069, -29.6842],
  'Gravataí-RS': [-50.9917, -29.9447],
  'Novo Hamburgo-RS': [-51.1308, -29.6783],
  'São Leopoldo-RS': [-51.1469, -29.7603],
  'Passo Fundo-RS': [-52.4067, -28.2578],
  'Bento Gonçalves-RS': [-51.5189, -29.1717],
  
  // === SANTA CATARINA ===
  'Joinville-SC': [-48.8489, -26.3044],
  'Blumenau-SC': [-49.0661, -26.9194],
  'São José-SC': [-48.6361, -27.6136],
  'Chapecó-SC': [-52.6186, -27.0964],
  'Itajaí-SC': [-48.6617, -26.9078],
  'Criciúma-SC': [-49.3697, -28.6778],
  'Jaraguá do Sul-SC': [-49.0717, -26.4853],
  'Palhoça-SC': [-48.6678, -27.6453],
  'Balneário Camboriú-SC': [-48.6353, -26.9906],
  'Brusque-SC': [-48.9178, -27.0978],
  'Itapema-SC': [-48.6117, -27.0903],
  'Camboriú-SC': [-48.6522, -27.0253],
  'Navegantes-SC': [-48.6544, -26.8989],
  
  // === BAHIA ===
  'Feira de Santana-BA': [-38.9669, -12.2669],
  'Vitória da Conquista-BA': [-40.8389, -14.8619],
  'Camaçari-BA': [-38.3247, -12.6978],
  'Itabuna-BA': [-39.2803, -14.7856],
  'Juazeiro-BA': [-40.5017, -9.4164],
  'Lauro de Freitas-BA': [-38.3331, -12.8978],
  'Porto Seguro-BA': [-39.0644, -16.4497],
  
  // === PERNAMBUCO ===
  'Jaboatão dos Guararapes-PE': [-35.0147, -8.1128],
  'Olinda-PE': [-34.8553, -8.0089],
  'Caruaru-PE': [-35.9761, -8.2839],
  'Petrolina-PE': [-40.5008, -9.3986],
  'Paulista-PE': [-34.8736, -7.9403],
  
  // === CEARÁ ===
  'Caucaia-CE': [-38.6531, -3.7367],
  'Maracanaú-CE': [-38.6253, -3.8767],
  'Juazeiro do Norte-CE': [-39.3153, -7.2131],
  'Sobral-CE': [-40.3508, -3.6861],
  'Eusébio-CE': [-38.4558, -3.8922],
  'Aquiraz-CE': [-38.3875, -3.9014],
  
  // === GOIÁS ===
  'Aparecida de Goiânia-GO': [-49.2469, -16.8228],
  'Anápolis-GO': [-48.9528, -16.3281],
  'Rio Verde-GO': [-50.9292, -17.7978],
  'Luziânia-GO': [-47.9506, -16.2528],
  'Senador Canedo-GO': [-49.0917, -16.7081],
  'Caldas Novas-GO': [-48.6253, -17.7442],
  
  // === MATO GROSSO ===
  'Várzea Grande-MT': [-56.1322, -15.6469],
  'Rondonópolis-MT': [-54.6356, -16.4706],
  'Sinop-MT': [-55.5036, -11.8642],
  'Tangará da Serra-MT': [-57.4989, -14.6228],
  'Sorriso-MT': [-55.7078, -12.5425],
  'Lucas do Rio Verde-MT': [-55.9044, -13.0506],
  'Primavera do Leste-MT': [-54.2969, -15.5603],
  'Nova Mutum-MT': [-56.0800, -13.8350],
  
  // === MATO GROSSO DO SUL ===
  'Dourados-MS': [-54.8056, -22.2231],
  'Três Lagoas-MS': [-51.6783, -20.7511],
  'Corumbá-MS': [-57.6533, -19.0089],
  'Ponta Porã-MS': [-55.7256, -22.5358],
  
  // === PARÁ ===
  'Ananindeua-PA': [-48.3722, -1.3656],
  'Santarém-PA': [-54.7089, -2.4386],
  'Marabá-PA': [-49.1178, -5.3686],
  'Parauapebas-PA': [-49.9031, -6.0678],
  'Castanhal-PA': [-47.9261, -1.2931],
  
  // === AMAZONAS ===
  'Parintins-AM': [-56.7356, -2.6286],
  'Itacoatiara-AM': [-58.4442, -3.1428],
  'Manacapuru-AM': [-60.6233, -3.2989],
  
  // === RONDÔNIA ===
  'Ji-Paraná-RO': [-61.9517, -10.8853],
  'Ariquemes-RO': [-63.0333, -9.9133],
  'Vilhena-RO': [-60.1456, -12.7406],
  
  // === TOCANTINS ===
  'Araguaína-TO': [-48.2072, -7.1911],
  'Gurupi-TO': [-49.0689, -11.7289],
  
  // === MARANHÃO ===
  'Imperatriz-MA': [-47.4917, -5.5186],
  'São José de Ribamar-MA': [-44.0539, -2.5489],
  'Timon-MA': [-42.8356, -5.0942],
  'Caxias-MA': [-43.3556, -4.8589],
  'Balsas-MA': [-46.0356, -7.5328],
  
  // === RIO GRANDE DO NORTE ===
  'Mossoró-RN': [-37.3442, -5.1878],
  'Parnamirim-RN': [-35.2628, -5.9156],
  
  // === PARAÍBA ===
  'Campina Grande-PB': [-35.8811, -7.2306],
  'Santa Rita-PB': [-34.9783, -7.1136],
  'Cabedelo-PB': [-34.8339, -6.9811],
  
  // === ALAGOAS ===
  'Arapiraca-AL': [-36.6611, -9.7525],
  'Rio Largo-AL': [-35.8394, -9.4781],
  
  // === SERGIPE ===
  'Nossa Senhora do Socorro-SE': [-37.1258, -10.8556],
  'Itabaiana-SE': [-37.4256, -10.6850],
  
  // === PIAUÍ ===
  'Parnaíba-PI': [-41.7767, -2.9050],
  'Picos-PI': [-41.4672, -7.0767],
  
  // === ACRE ===
  'Cruzeiro do Sul-AC': [-72.6756, -7.6306],
  
  // === AMAPÁ ===
  'Santana-AP': [-51.1728, -0.0583],
};

// Função para obter coordenadas de uma cidade
export function getCityCoordinates(city: string, uf: string): [number, number] | null {
  const key = `${city}-${uf}`;
  return BRAZIL_CITY_COORDINATES[key] || null;
}

// Função para obter todas as cidades com coordenadas
export function getCitiesWithCoordinates(): string[] {
  return Object.keys(BRAZIL_CITY_COORDINATES);
}
