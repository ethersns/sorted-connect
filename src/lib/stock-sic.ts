/**
 * UK SIC 2007 codes for businesses that are likely to hold physical stock.
 * Used to query the Companies House register. Descriptions are the official
 * Companies House condensed SIC descriptions.
 */
export interface StockSegment {
  id: string
  label: string
  why: string
  codes: Record<string, string>
}

export const STOCK_SEGMENTS: StockSegment[] = [
  {
    id: 'wholesale',
    label: 'Wholesalers & distributors',
    why: 'Buy, store and ship stock in bulk. The strongest fit for SORTED.',
    codes: {
      '46210': 'Wholesale of grain, seeds and animal feeds',
      '46310': 'Wholesale of fruit and vegetables',
      '46320': 'Wholesale of meat and meat products',
      '46330': 'Wholesale of dairy products, eggs and oils',
      '46341': 'Wholesale of fruit and vegetable juices, mineral water and soft drinks',
      '46342': 'Wholesale of wine, beer, spirits and other alcoholic beverages',
      '46370': 'Wholesale of coffee, tea, cocoa and spices',
      '46380': 'Wholesale of other food, including fish',
      '46390': 'Non-specialised wholesale of food, beverages and tobacco',
      '46410': 'Wholesale of textiles',
      '46420': 'Wholesale of clothing and footwear',
      '46431': 'Wholesale of audio tapes, records, CDs and video tapes',
      '46439': 'Wholesale of radio, television goods and electrical household appliances',
      '46440': 'Wholesale of china, glassware and cleaning materials',
      '46450': 'Wholesale of perfume and cosmetics',
      '46460': 'Wholesale of pharmaceutical goods',
      '46470': 'Wholesale of furniture, carpets and lighting equipment',
      '46480': 'Wholesale of watches and jewellery',
      '46491': 'Wholesale of musical instruments',
      '46499': 'Wholesale of household goods (other)',
      '46510': 'Wholesale of computers, peripheral equipment and software',
      '46520': 'Wholesale of electronic and telecommunications equipment and parts',
      '46610': 'Wholesale of agricultural machinery, equipment and supplies',
      '46620': 'Wholesale of machine tools',
      '46630': 'Wholesale of mining, construction and civil engineering machinery',
      '46640': 'Wholesale of machinery for the textile industry',
      '46650': 'Wholesale of office furniture',
      '46660': 'Wholesale of other office machinery and equipment',
      '46690': 'Wholesale of other machinery and equipment',
      '46711': 'Wholesale of petroleum and petroleum products',
      '46720': 'Wholesale of metals and metal ores',
      '46730': 'Wholesale of wood, construction materials and sanitary equipment',
      '46740': 'Wholesale of hardware, plumbing and heating equipment and supplies',
      '46750': 'Wholesale of chemical products',
      '46760': 'Wholesale of other intermediate products',
      '46770': 'Wholesale of waste and scrap',
      '46900': 'Non-specialised wholesale trade',
    },
  },
  {
    id: 'retail',
    label: 'Retailers & e-commerce',
    why: 'Shops and online sellers managing stock across tills, websites and marketplaces.',
    codes: {
      '47190': 'Other retail sale in non-specialised stores',
      '47210': 'Retail sale of fruit and vegetables in specialised stores',
      '47250': 'Retail sale of beverages in specialised stores',
      '47410': 'Retail sale of computers, peripheral units and software',
      '47421': 'Retail sale of mobile telephones',
      '47430': 'Retail sale of audio and video equipment',
      '47510': 'Retail sale of textiles in specialised stores',
      '47520': 'Retail sale of hardware, paints and glass',
      '47530': 'Retail sale of carpets, rugs, wall and floor coverings',
      '47540': 'Retail sale of electrical household appliances',
      '47591': 'Retail sale of musical instruments and scores',
      '47599': 'Retail of furniture, lighting and similar (not musical instruments)',
      '47610': 'Retail sale of books',
      '47640': 'Retail sale of sports goods',
      '47650': 'Retail sale of games and toys',
      '47710': 'Retail sale of clothing',
      '47721': 'Retail sale of footwear',
      '47722': 'Retail sale of leather goods',
      '47741': 'Retail sale of hearing aids',
      '47749': 'Retail sale of medical and orthopaedic goods (other)',
      '47750': 'Retail sale of cosmetic and toilet articles',
      '47760': 'Retail sale of flowers, plants, seeds, fertilisers and pet food',
      '47770': 'Retail sale of watches and jewellery',
      '47789': 'Other retail sale of new goods in specialised stores',
      '47791': 'Retail sale of antiques including antique books',
      '47910': 'Retail sale via mail order houses or via Internet',
      '47990': 'Other retail sale not in stores, stalls or markets',
    },
  },
  {
    id: 'motor',
    label: 'Motor parts & vehicle trade',
    why: 'Parts suppliers, dealers and accessories with high SKU counts.',
    codes: {
      '45310': 'Wholesale trade of motor vehicle parts and accessories',
      '45320': 'Retail trade of motor vehicle parts and accessories',
      '45400': 'Sale, maintenance and repair of motorcycles and parts',
      '45190': 'Sale of other motor vehicles',
    },
  },
  {
    id: 'logistics',
    label: 'Warehousing, 3PL & logistics',
    why: 'Store stock for other businesses. Potential customers and referral partners.',
    codes: {
      '52101': 'Operation of warehousing and storage facilities for water transport',
      '52102': 'Operation of warehousing and storage facilities for air transport',
      '52103': 'Operation of warehousing and storage facilities for land transport',
      '52290': 'Other transportation support activities',
      '82920': 'Packaging activities',
    },
  },
  {
    id: 'manufacturing',
    label: 'Manufacturers & makers',
    why: 'Hold raw materials, work in progress and finished goods.',
    codes: {
      '10390': 'Other processing and preserving of fruit and vegetables',
      '10710': 'Manufacture of bread and fresh pastry goods and cakes',
      '10890': 'Manufacture of other food products',
      '11050': 'Manufacture of beer',
      '13990': 'Manufacture of other textiles',
      '14190': 'Manufacture of other wearing apparel and accessories',
      '16230': "Manufacture of other builders' carpentry and joinery",
      '20420': 'Manufacture of perfumes and toilet preparations',
      '22290': 'Manufacture of other plastic products',
      '25110': 'Manufacture of metal structures and parts of structures',
      '25620': 'Machining',
      '25990': 'Manufacture of other fabricated metal products',
      '27900': 'Manufacture of other electrical equipment',
      '28990': 'Manufacture of other special-purpose machinery',
      '31090': 'Manufacture of other furniture',
      '32120': 'Manufacture of jewellery and related articles',
      '32990': 'Other manufacturing',
    },
  },
  {
    id: 'hire',
    label: 'Equipment hire & rental',
    why: 'Track rental stock in and out, by item and location.',
    codes: {
      '77110': 'Renting and leasing of cars and light motor vehicles',
      '77210': 'Renting and leasing of recreational and sports goods',
      '77290': 'Renting and leasing of other personal and household goods',
      '77320': 'Renting and leasing of construction and civil engineering machinery',
      '77390': 'Renting and leasing of other machinery, equipment and tangible goods',
    },
  },
]

export const ALL_STOCK_SIC: Record<string, string> = Object.assign(
  {},
  ...STOCK_SEGMENTS.map((s) => s.codes),
)

export function segmentForSic(codes: string[]): string | null {
  for (const s of STOCK_SEGMENTS) if (codes.some((c) => c in s.codes)) return s.id
  return null
}

export const segmentLabel = (id: string | null) =>
  STOCK_SEGMENTS.find((s) => s.id === id)?.label ?? 'Other'

/** Rows requested per Companies House advanced-search call (the API allows up to 5,000). */
export const CH_PAGE_SIZE = 1000
/** Deepest offset requested for one SIC code before moving on to the next code. */
export const CH_MAX_OFFSET = 10_000
