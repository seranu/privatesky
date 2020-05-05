$$.swarms.describe("basicTestEcho", {
    say: function (message) {
        this.return(null, 'Echo ' + message);
    }
});