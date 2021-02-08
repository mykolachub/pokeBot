function getMarcus(attr) {
  if (
    attr === 'timur' ||
    attr === 'marcus' ||
    attr === 'shems' ||
    attr === 'NaN' ||
    attr === 6666
  ) {
    return {
      name: 'Marcus Aurelius',
      id: 'NaN',
      type: 'Chief',
      abilities: 'NodeJS',
      weakness: 'Java, ORM, IP-05',
      height: 'undefined',
      weight: 'undefined',
      image: 'marcus.png',
      generation: 'Generation X',
      description:
        '26 years in IT, expert in private clouds, software engineering, cybernetics, distributed systems, architecture, multi-paradigm & meta-programming',
    };
  }
  return 'other response';
}

module.exports = getMarcus;
