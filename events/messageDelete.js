const snipes = require('./snipes');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        snipes.set(message.channel.id, {
            content: message.content,
            author: message.author,
            attachments: message.attachments.map(a => a.url),
        });

        setTimeout(() => {
            snipes.delete(message.channel.id);
        }, 60000);
    },
};