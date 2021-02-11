require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Keyboard, Key } = require('telegram-keyboard');
const mongoose = require('mongoose');
const pokemon = require('./modules/pokemons');
const template = require('./modules/templates');

// connecting database
mongoose.connect(process.env.MONGO_KEY, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', (e) => {
  console.log('database connection error', e);
});
db.once('open', () => {
  console.log('connected to database');
});

const userSchema = new mongoose.Schema({
  userId: Number,
  name: String,
  pokemons: Array,
  dailyPrize: Boolean,
});

// user
const User = mongoose.model('User', userSchema);
let user;

// local chat data
const localData = {
  id: null,
};

const bot = new Telegraf(process.env.BOT_TOKEN_TEST);

// getting random pokemon
async function randomPokemon(ctx) {
  const randomId = pokemon.getRandomPokemonId(1, 898);
  const errorMessage = 'Something went wrong.. Try again!';
  const promises = [
    pokemon.getPokemonInfo(randomId),
    pokemon.getGenerationAndDescription(randomId),
  ];
  try {
    const responses = await Promise.all(promises);
    const data = responses.reduce((acc, val) => ({ ...acc, ...val }));
    return ctx.replyWithPhoto(
      { url: data.image },
      { caption: template.getTemplateByPokemon(data), parse_mode: 'Markdown' }
    );
  } catch (err) {
    return ctx.replyWithMarkdown(errorMessage);
  }
}

function resetDailyPrize() {
  const period = 1000 * 60 * 60 * 24; // every 24h
  setInterval(async () => {
    await User.updateMany({}, { dailyPrize: false }, (err) => {
      if (err) console.log(err);
    });
    console.log('dailyPrize reset for all');
  }, period);
}

function startDailyPrize(ctx) {
  const keyboard = Keyboard.make([Key.callback('Get Random', 'random')]);
  return ctx.reply('You can catch a random Pokemon', keyboard.inline());
}

bot.start(async (ctx) => {
  try {
    const { length } = await User.find({ userId: ctx.message.chat.id });
    // проверка есть ли юзер в базе
    if (length === 0) {
      // создает нового юзера
      user = new User({
        name: ctx.message.chat.first_name,
        userId: ctx.message.chat.id,
        pokemons: [],
        dailyPrize: true,
      });

      // setting id localy
      localData.id = ctx.message.chat.id;

      // сохраняю в базу
      user.save((e) => {
        if (e) console.log(e);
        console.log(`${ctx.message.chat.first_name} successfuly registered`);
      });

      // сброс времени обновления
      const serverTime = new Date();
      serverTime.setHours(0, 0, 0);
      serverTime.setDate(serverTime.getDate() + 1);
      resetDailyPrize();

      // добавляю клавиатуру для навигации
      const keyboard = Keyboard.make(['/help', '/collection']);
      const message = template.getStart();
      ctx.replyWithMarkdown(message, keyboard.reply());
      startDailyPrize(ctx);

      return;
    }
    // в случае если бот уже был запущен и пользователь есть в базе
    ctx.reply('Bot has already been started');
  } catch (e) {
    console.log(e);
  }
});

// sends help into
bot.command('help', (ctx) => {
  const message = template.getHelp();
  ctx.replyWithMarkdown(message);
});

// get and send user collection
bot.command('collection', async (ctx) => {
  try {
    const { pokemons } = await User.findOne({ userId: localData.id });
    const message = template.createCollectionTemplate(pokemons);
    ctx.replyWithMarkdown(message);
  } catch (error) {
    console.log(error);
  }
});

// sends random pokemon
bot.action('catch', async (ctx) => {});

// sends help into
bot.command('random', async (ctx) => {
  await randomPokemon(ctx);
});

// sends pokemons types
bot.command('types', async (ctx) => {
  try {
    const list = await pokemon.getPokemonTypesList();
    const message = template.getTemplateTypesList(list);
    ctx.replyWithMarkdown(message);
  } catch (e) {
    console.log(e);
  }
});

// sends random pokemon
// bot.hears('Get Random Pokemon', async (ctx) => {
//   await randomPokemon(ctx);
// });

bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  const command = message.startsWith('/');
  const filter = message.replace('/', '').trim().toLowerCase();

  // проверка является ли сообщение покемоном
  return pokemon
    .isPokemon(filter)
    .then(async (res) => {
      const isPokemon = res;
      const number = Number(filter);
      // если покемон: name, /name, number, /number
      if (isPokemon || number) {
        const type = number ? 'number' : 'string';
        const attr = type === 'string' ? filter : number;
        const errorMessage = 'There is no such _Pokémon_.. Try again!';
        const promises = [pokemon.getPokemonInfo(attr), pokemon.getGenerationAndDescription(attr)];
        try {
          const responses = await Promise.all(promises);
          const data = responses.reduce((acc, val) => ({ ...acc, ...val }));
          const message = template.getTemplateByPokemon(data);
          ctx.replyWithPhoto({ url: data.image }, { caption: message, parse_mode: 'Markdown' });
        } catch (err) {
          ctx.replyWithMarkdown(errorMessage);
        }
      } else if (command && filter !== 'start' && !isPokemon) {
        // если не покемон а тип: /type
        const errorMessage = 'There is no such Pokémon _type_.. Try again!';
        try {
          const data = await pokemon.getPokemonByType(filter);
          const message = template.getTemplateByType(filter, data);
          ctx.replyWithMarkdown(message);
        } catch (error) {
          ctx.replyWithMarkdown(errorMessage);
        }
      } else {
        ctx.replyWithMarkdown('I do not know what that is.. Try again!');
      }
    })
    .catch(() => {
      ctx.replyWithMarkdown('I do not know what that is.. Try again!');
    });
});

bot.telegram.setMyCommands([
  { command: 'help', description: 'What should I do?' },
  { command: 'collection', description: 'View my Pokemons' },
  { command: 'types', description: 'View Pokemons Types' },
  { command: 'random', description: 'Get Random Pokemon' },
  { command: 'catch', description: 'Get Daily Prize' },
]);

bot.launch();
