require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const pokemon = require('./modules/pokemons');

const bot = new Telegraf(process.env.BOT_TOKEN);

const createTemplate = (response) => `
Name: ${response.name}
Id: ${response.id}
Types: ${response.type}
Abilities: ${response.abilities}
Weakness: ${response.weakness}
Height: ${response.height}
Weight: ${response.weight}
Description: ${response.description}
`;

bot.start((ctx) => {
  ctx.reply('Welcome');
  ctx.reply('Send me name of Pokémon', Markup.keyboard([['Get Random Pokemon']]).resize());
});

bot.hears('Get Random Pokemon', (ctx) => {
  const random = pokemon.getRandomPokemonId(1, 898);
  pokemon
    .getPokemon(random)
    .then((response) => {
      ctx.replyWithPhoto({ url: response.image }, { caption: createTemplate(response) });
    })
    .catch(() => {
      ctx.reply('Something went wrong.. Try again!');
    });
});

// bot.help((ctx) => ctx.reply('Send me a sticker'));
// bot.on('sticker', (ctx) => ctx.reply('👍'));
// bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.launch();
