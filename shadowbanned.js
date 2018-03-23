/**
 * How does it work? For both deleted and shadowbanned users
 * /user/[user]/about.json returns a 404 error but
 * /api/username_available.json returns false. Non-existent users show
 * up as available and normal users don't return an error for
 * about.json.
 * @param {String} user the user to test
 * @param {Function} callback to receive the result
 */
function Checker(user, callback) {
    this.user = user;
    this.callback = callback;
    var _this = this;
    this.isVisible(function(visible) {
        if (visible) {
            callback(user + ' looks normal');
        } else {
            _this.isAvailable(function(available) {
                if (available) {
                    callback(user + ' does not exist');
                } else {
                    callback(user + ' is shadowbanned or deleted');
                }
            });
        }
    });
}
/**
 * Fetch a URL through a CORS proxy.
 * @param {String} url
 * @param {Function} callback is passed the result
 * @see http://cors-anywhere.herokuapp.com/
 */
Checker.prototype.fetch = function(url, callback) {
    var async = callback != null;
    var xhr = new XMLHttpRequest();
    if (async) {
        xhr.onload = function() {
            callback(xhr.responseText, xhr);
        };
    }
    xhr.open('GET', 'https://cors-anywhere.herokuapp.com/' + url, async);
    xhr.send();
    return async ? xhr : xhr.responseText;
};

/**
 * @param {Function} callback called with true if user doesn't exist
 */
Checker.prototype.isAvailable = function(callback) {
    var api = "http://www.reddit.com/api/username_available.json?user=";
    this.fetch(api + this.user, function(result) {
        callback(JSON.parse(result));
    });
};

/**
 * @param {Function} callback called with true if user is visible
 */
Checker.prototype.isVisible = function(callback) {
    var about = 'http://www.reddit.com/user/' + this.user + '/about.json';
    this.fetch(about, function(result) {
        callback(JSON.parse(result).error == null);
    });
};

function Output(node) {
    this.node = node;
}

Output.prototype.clear = function() {
    this.node.innerHTML = '';
};

Output.prototype.print = function(html) {
    this.node.textContent = html;
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
