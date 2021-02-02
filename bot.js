require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const pokemon = require('./modules/pokemons');

const bot = new Telegraf(process.env.BOT_TOKEN);

// creates template from Pokemon's Info
function createTemplate(response) {
  return `
${response.id} *${response.name}*
Type: ${response.type}

${response.description}

Abilities: ${response.abilities}
Weakness: ${response.weakness}
Height: ${response.height}
Weight: ${response.weight}`;
}

// getting Pokemon Info
function getPokemom(ctx, attr, mess) {
  return pokemon
    .getPokemon(attr)
    .then((response) => {
      ctx.replyWithPhoto(
        { url: response.image },
        { caption: createTemplate(response), parse_mode: 'Markdown' }
      );
    })
    .catch(() => {
      ctx.reply(mess);
    });
}

bot.start((ctx) => {
  ctx.reply('Welcome');
  ctx.reply('Send me name of Pokémon', {
    parse_mode: 'Markdown',
    ...Markup.keyboard([['Get Random Pokemon']]).resize(),
  });
});

bot.hears('Get Random Pokemon', (ctx) => {
  const randomId = pokemon.getRandomPokemonId(1, 898);
  const errorMessage = 'Something went wrong.. Try again!';
  getPokemom(ctx, randomId, errorMessage);
});

bot.on('text', (ctx) => {
  const message = ctx.message.text;
  const number = Number(message);
  const type = number ? 'number' : 'string';
  const attr = type === 'string' ? message.trim().toLowerCase() : number;
  const errorMessage = 'Something went wrong or there is no such pokemon.. Try again!';
  getPokemom(ctx, attr, errorMessage);
});

// bot.help((ctx) => ctx.reply('Send me a sticker'));
// bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.launch();
