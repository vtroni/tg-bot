const { Random } = require('random-js');
const questions = require('./questions.json');

const random = new Random();

const getRandomQuestion = (topic) => {
  const questionTopic = topic.toLowerCase();
  const randomQuestionIndex = random.integer(0, questions[questionTopic].length - 1);
  return questions[questionTopic][randomQuestionIndex];
}

const getCorrectAnswer = (topic, id, lang) => {
  const question = questions[topic].find((question) => question.id === id);

  if (!question) {
    return '';
  }

  if (!question.hasOptions) {
    return question.answer[lang];
  }

  const correctOption = question.options.find((option) => option.isCorrect);
  if (!correctOption) {
    return '';
  }

  const { text } = correctOption;

  if (typeof text === 'object' && text !== null) {
    return text[lang];
  }

  return text;
}

module.exports = { getRandomQuestion, getCorrectAnswer};