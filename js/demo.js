const makePhoto = (id, title, aspect, palette, year = 2026) => ({
  id,
  name: title,
  mimeType: 'image/svg+xml',
  kind: 'image',
  createdTime: `${year}-08-${String((id % 20) + 1).padStart(2, '0')}T10:00:00Z`,
  modifiedTime: `${year}-08-${String((id % 20) + 1).padStart(2, '0')}T10:00:00Z`,
  thumbnailUrl: `assets/demo-${id}.svg`,
  viewUrl: '#',
  contentUrl: '',
  width: aspect[0],
  height: aspect[1],
  tags: [], categories: [], favorite: false
});

export const demoMedia = [
  makePhoto(1, 'First light', [1400, 1000], ['#1a2530','#c39c6c']),
  makePhoto(2, 'The climb', [900, 1300], ['#283b4a','#9b7355']),
  makePhoto(3, 'No rush', [1600, 1000], ['#20262d','#d6b98c']),
  makePhoto(4, 'Summit view', [1400, 900], ['#273342','#8ca3b9']),
  makePhoto(5, 'The four of us', [1000, 1200], ['#2d2430','#b79181']),
  makePhoto(6, 'Road home', [1600, 1000], ['#242322','#bf8e66']),
  makePhoto(7, 'Family table', [1300, 920], ['#242b25','#c3a880'], 2025),
  makePhoto(8, 'City after rain', [900, 1350], ['#19222a','#7390a4'], 2025),
  makePhoto(9, 'College days', [1500, 1000], ['#332d28','#c49b69'], 2024),
  makePhoto(10, 'Golden hour', [1500, 950], ['#2a2620','#d39a5c'], 2024),
  makePhoto(11, 'Quiet morning', [980, 1300], ['#1d2325','#b9b1a1'], 2023),
  makePhoto(12, 'Long conversation', [1600, 1040], ['#292b34','#7d8a9f'], 2023)
];

export const demoMemories = [
  { id: 'kurinjal', title: 'Kurinjal / The long way up', description: 'A long trail, early light, and the kind of tiredness that turns into a story later.', startDate: '2026-08-13', endDate: '2026-08-15', coverMediaId: 1, category: 'Trips', tags: ['trek','friends','2026'], mediaIds: [1,2,3,4,5,6], location: 'Karnataka', theme: 'cinematic' },
  { id: 'family', title: 'Family, around the table', description: 'Small moments that never look small when you look back.', startDate: '2025-11-02', endDate: '2025-11-03', coverMediaId: 7, category: 'Family', tags: ['family','home'], mediaIds: [7], location: 'Vellore', theme: 'warm' },
  { id: 'city', title: 'Hyderabad after rain', description: 'Street lights, long roads and an evening that kept going.', startDate: '2025-10-05', endDate: '2025-10-05', coverMediaId: 8, category: 'Travel', tags: ['hyderabad','city'], mediaIds: [8], location: 'Hyderabad', theme: 'night' },
  { id: 'college', title: 'The days between lectures', description: 'The people, places and chaos that made college feel like a second home.', startDate: '2024-08-18', endDate: '2024-08-20', coverMediaId: 9, category: 'College', tags: ['college','friends'], mediaIds: [9], location: 'Vellore', theme: 'film' },
  { id: 'golden', title: 'Golden hour', description: 'No plan. Just light.', startDate: '2024-03-17', endDate: '2024-03-17', coverMediaId: 10, category: 'Friends', tags: ['sunset','friends'], mediaIds: [10], location: 'Hyderabad', theme: 'gold' },
  { id: 'morning', title: 'Quiet morning', description: 'A slower chapter.', startDate: '2023-01-08', endDate: '2023-01-08', coverMediaId: 11, category: 'Nature', tags: ['morning','quiet'], mediaIds: [11,12], location: 'Vellore', theme: 'minimal' }
];
