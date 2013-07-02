/**
 * How does it work? For shadowbanned users /user/[user] returns a 404
 * and /user/[user]/about.json returns a 200. For every other
 * username, both return either 200 (normal) or 404 (doesn't exist or
 * deleted). This checker just uses anyorigin.com to test these two
 * pages.
 * @param {String} user the user to test.
 * @param {Function} callback to receive the result.
 */
function Checker(user, callback) {
    this.user = user;
    this.callback = callback;
    this.base = null;
    this.about = null;
    var url = 'http://www.reddit.com/user/' + user;
    this.fetch(url, function(data) {
        this.base = data.status.http_code;
        this.check();
    }.bind(this));
    this.fetch(url + '/about.json', function(data) {
        this.about = data.status.http_code;
        this.check();
    }.bind(this));
}

/**
 * Generate a random function name for JSONP.
 * @returns {String} a randomly-generated function name.
 */
Checker.prototype.generateName = function() {
    var selection = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var name = [];
    for (var i = 0; i < 32; i++) {
        name.push(selection[~~(Math.random() * selection.length)]);
    }
    return name.join('');
};

/**
 * Fetch a URL using anyorigin.com.
 * @param {String} url
 * @param {Function} callback is passed the result.
 */
Checker.prototype.fetch = function(url, callback) {
    var s = document.createElement('script');
    var fname = this.generateName();
    window[fname] = function(data) {
        delete window[fname];
        callback(data);
    };
    s.src = 'http://anyorigin.com/get?callback=' + fname + '&url=' +
        encodeURIComponent(url);
    document.body.appendChild(s);
};

/**
 * Invoke the callback if all of the results have arrived.
 */
Checker.prototype.check = function() {
    if (this.base != null && this.about != null) {
        if (this.base == 404 && this.about == 200) {
            this.callback(this.user + ' is shadowbanned');
        } else if (this.base == 404 && this.about == 404) {
            this.callback(this.user + ' does not exist');
        } else {
            this.callback(this.user + ' looks normal');
        }
    }
};

function Output(node) {
    this.node = node;
}

Output.prototype.clear = function() {
    this.node.innerHTML = '';
};

Output.prototype.print = function(html) {
    this.node.innerHTML = html;
};

window.addEventListener('load', function() {
    var check = document.getElementById('check');
    var user = document.getElementById('user');
    var output = new Output(document.getElementById('output'));

    function submit(event) {
        if (event) event.preventDefault();
        location.hash = user.value;
        output.print('Checking ' +  user.value + ' ...');
        new Checker(user.value, function(result) {
            output.print(result);
        });
        user.blur();
    }

    check.addEventListener('submit', submit);

    user.addEventListener('input', function() {
        output.clear();
    });

    if (location.hash != '') {
        user.value = location.hash.slice(1);
        submit();
    }
});
