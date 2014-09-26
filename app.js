(function() {

function getValueForHeaderField(headers, field) {
  for (var i = 0, header; header = headers[i]; ++i) {
    if (header.name == field) {
      return header.value;
    }
  }
  return null;
}

/*
function getLink(links, rel) {
  for (var i = 0, link; link = links[i]; ++i) {
    if (rel == link.rel) {
      return link.href;
    }
  }
  return null;
}

function isContactMatch(entry, email) {
  for (var i = 0, email; email = entry.gd$email[i]; ++i) {
    if (email.address == email) {
      return true;
    }
  }
  return null;
}

function getProfileImageForEmail(entries, email) {
  for (var i = 0, entry; entry = entries[i]; ++i) {
    if (isContactMatch(entry, email)) {
      return getLink(entry.links, 'http://schemas.google.com/contacts/2008/rel#photo');
    }
  }
  return null;
}
*/

var template = document.querySelector('#t');

template.toggleDrawer = function() {
  this.$ && this.$.drawerPanel.togglePanel();
};

template.toggleSearch = function() {
  this.$.search.toggle();
};

template.menuSelect = function(e, detail, sender) {
  if (detail.isSelected) {
    this.toggleDrawer();
  }
};

function getAllUserProfileImages(users, nextPageToken, callback) {
  gapi.client.plus.people.list({
    userId: 'me', collection: 'visible', pageToken: nextPageToken
  }).execute(function(resp) {

    users = resp.items.reduce(function(o, v, i) {
      o[v.displayName] = v.image.url;
      return o;
    }, users);

    if (resp.nextPageToken) {
      getAllUserProfileImages(users, resp.nextPageToken, callback);
    } else {
      callback(users);
    }

  });
}

template.onSigninSuccess = function(e, detail, sender) {
  this.isAuthenticated = true;

  var gapi = e.detail.gapi;

  gapi.client.load('gmail', 'v1', function() {
    var gmail = gapi.client.gmail.users;

    // Fetch only the emails in the user's inbox.
    gmail.threads.list({userId: 'me', q: 'in:inbox -is:chat'}).execute(function(resp) {
      var threads = resp.threads;

      threads.forEach(function(t, i) {
        gmail.threads.get({userId: 'me', 'id': t.id}).execute(function(resp) {
          threads[i].messages = resp.messages;

          threads[i].messages.forEach(function(m, j) {

            var headers = m.payload.headers;

            var fromHeaderMatches = getValueForHeaderField(headers, 'From').match(/"?(.*)"?\s<(.*)>/);

            m.from = {};
            if (fromHeaderMatches) {
              m.from = {
                name: fromHeaderMatches[1],
                email: fromHeaderMatches[2]
              }
            }

            // Example: Thu Sep 25 2014 14:43:18 GMT-0700 (PDT) -> Sept 25
            var date = new Date(getValueForHeaderField(headers, 'Date'));
            m.date = date.toDateString().split(' ').slice(1,3).join(' ');

            m.to = getValueForHeaderField(headers, 'To')
            m.subject = getValueForHeaderField(headers, 'Subject');
          });

          template.threads = threads;

        });
      });

    });

    gmail.labels.list({userId: 'me'}).execute(function(resp) {

      // Don't include system labels.
      resp.labels = resp.labels.filter(function(label, i) {
        label.color = template.LABEL_COLORS[
            Math.round(Math.random() * template.LABEL_COLORS.length)];
        return label.type != 'system';
      });

      template.labels = resp.labels;
    });
  });

  gapi.client.load('plus', 'v1', function() {

    // Get user's profile pic, cover image, email, and name.
    gapi.client.plus.people.get({userId: 'me'}).execute(function(resp) {
      var img = resp.image.url.replace(/(.+)\?sz=\d\d/, "$1?sz=80");
      template.user = {
        name: resp.displayName,
        email: resp.emails[0].value,
        profile: img,
        cover: resp.cover.coverPhoto.url
      };
    });

    var users = {};

    getAllUserProfileImages(users, null, function(users) {
      template.users = users;
      template.users[template.user.name] = template.user.profile;
    });

  });

};

template.LABEL_COLORS = ['pink', 'orange', 'green', 'yellow', 'teal', 'purple'];

template.isAuthenticated = false;

template.previousSearches = [
  "something fun",
  "tax forms",
  'to: me',
  'airline tickets',
  'party on saturday'
];

/*template.user = {
  name: 'Some User',
  email: 'some@example.com',
  profile: 'https://lh5.googleusercontent.com/-kgFnix5akCc/AAAAAAAAAAI/AAAAAAAAOqk/IVG-V3nJ8jM/s60-c/photo.jpg'
};*/

/*
template.data = [{
  name: 'Eric',
  profile: 'https://lh5.googleusercontent.com/-kgFnix5akCc/AAAAAAAAAAI/AAAAAAAAOqk/IVG-V3nJ8jM/s60-c/photo.jpg',
  subject: 'Hi there',
  snippet: 'How is it going pal? What have you been up to lately?',
  timestamp: '7:00pm'
}, {
  name: 'Addy',
  profile: 'https://lh3.googleusercontent.com/-riQH0F3Zb2k/AAAAAAAAAAI/AAAAAAAAyyI/A0ynkSbO-nM/s60-c/photo.jpg',
  subject: 'Yeoman',
  snippet: 'Can we finalize the dates for the Polymer meetup?',
  timestamp: '6:34pm'
}, {
  name: 'Alice',
  profile: 'https://lh5.googleusercontent.com/-nS21Q4tD1R4/AAAAAAAAAAI/AAAAAAAAAp4/ixMudlaPGDs/s60-c/photo.jpg',
  subject: 'Accessible web components',
  snippet: 'I have some thoughts about making Polymer components accessible. Do you want to schedule a meeting?',
  timestamp: '3:14pm'
}, {
  name: 'Rob',
  profile: 'https://lh3.googleusercontent.com/-0IG6advy6qg/AAAAAAAAAAI/AAAAAAAAAJM/pivb_QaIJjQ/s60-c/photo.jpg',
  subject: 'Business trip',
  snippet: 'Can we finalize the dates for the Polymer meetup?',
  timestamp: '10:34am'
}, {
  name: 'Rob',
  profile: 'https://lh3.googleusercontent.com/-0IG6advy6qg/AAAAAAAAAAI/AAAAAAAAAJM/pivb_QaIJjQ/s60-c/photo.jpg',
  subject: 'Business trip',
  snippet: 'Can we finalize the dates for the Polymer meetup?',
  timestamp: '10:34am'
}, {
  name: 'Rob',
  profile: 'https://lh3.googleusercontent.com/-0IG6advy6qg/AAAAAAAAAAI/AAAAAAAAAJM/pivb_QaIJjQ/s60-c/photo.jpg',
  subject: 'Business trip',
  snippet: 'Can we finalize the dates for the Polymer meetup?',
  timestamp: '10:34am'
}, {
   name: 'Rob',
   profile: 'https://lh3.googleusercontent.com/-0IG6advy6qg/AAAAAAAAAAI/AAAAAAAAAJM/pivb_QaIJjQ/s60-c/photo.jpg',
   subject: 'Business trip',
   snippet: 'Can we finalize the dates for the Polymer meetup?',
   timestamp: '10:34am'
 }, {
    name: 'Rob',
    profile: 'https://lh3.googleusercontent.com/-0IG6advy6qg/AAAAAAAAAAI/AAAAAAAAAJM/pivb_QaIJjQ/s60-c/photo.jpg',
    subject: 'Business trip',
    snippet: 'Can we finalize the dates for the Polymer meetup?',
    timestamp: '10:34am'
  }, {
     name: 'Rob',
     profile: 'https://lh3.googleusercontent.com/-0IG6advy6qg/AAAAAAAAAAI/AAAAAAAAAJM/pivb_QaIJjQ/s60-c/photo.jpg',
     subject: 'Business trip',
     snippet: 'Can we finalize the dates for the Polymer meetup?',
     timestamp: '10:34am'
   }, {
      name: 'Rob',
      profile: 'https://lh3.googleusercontent.com/-0IG6advy6qg/AAAAAAAAAAI/AAAAAAAAAJM/pivb_QaIJjQ/s60-c/photo.jpg',
      subject: 'Business trip',
      snippet: 'Can we finalize the dates for the Polymer meetup?',
      timestamp: '10:34am'
    }, {
       name: 'Rob',
       profile: 'https://lh3.googleusercontent.com/-0IG6advy6qg/AAAAAAAAAAI/AAAAAAAAAJM/pivb_QaIJjQ/s60-c/photo.jpg',
       subject: 'Business trip',
       snippet: 'Can we finalize the dates for the Polymer meetup?',
       timestamp: '10:34am'
     }];
*/

template.addEventListener('template-bound', function(e) {

var titleStyle = document.querySelector('.title').style;
var toolbar = document.querySelector('#mainheader');

document.querySelector('#drawerPanel').addEventListener('core-header-transform', function(e) {
  var d = e.detail;

  // d.y: the amount that the header moves up
  // d.height: the height of the header when it is at its full size
  // d.condensedHeight: the height of the header when it is condensed
  //scale header's title
  var m = d.height - d.condensedHeight;
  var scale = Math.max(0.5, (m - d.y) / (m / 0.25)  + 0.5);
  titleStyle.transform = titleStyle.transform = 'scale(' + scale + ') translateZ(0)';

  // Adjust header's color
  //toolbar.style.color = (d.y >= d.height - d.condensedHeight) ? '#fff' : '';
});


});

})();
