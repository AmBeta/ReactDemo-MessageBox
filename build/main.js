var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var MessageItem = React.createClass({
  displayName: 'MessageItem',

  handleMsgHasRead: function (e) {
    this.props.onMsgHasRead(this.props.msgId);
  },

  render: function () {
    var time = new Date(+this.props.msgTime);
    var year = time.getFullYear();
    var month = formatDigit(time.getMonth() + 1);
    var date = formatDigit(time.getDate());
    var hour = formatDigit(time.getHours());
    var minute = formatDigit(time.getMinutes());
    time = '' + year + '-' + month + '-' + date + ' ' + hour + ':' + minute;

    function formatDigit(d) {
      return (d < 10 ? '0' : '') + d;
    }

    return React.createElement(
      'div',
      { className: 'msgItem' },
      React.createElement(
        'div',
        { className: 'msgItemHeader' },
        React.createElement(
          'span',
          { className: 'msgSender' },
          this.props.msgSender
        ),
        React.createElement(
          'span',
          { className: 'msgTime' },
          time
        )
      ),
      React.createElement(
        'div',
        { className: 'msgItemInner' },
        React.createElement(
          'div',
          { className: 'msgContent' },
          this.props.children
        ),
        React.createElement(
          'a',
          { href: '#', className: 'hasReadBtn',
            onClick: this.handleMsgHasRead },
          '标为已读'
        )
      )
    );
  }
});

var MessageList = React.createClass({
  displayName: 'MessageList',

  handleMsgHasRead: function (msgId) {
    this.props.onMsgHasRead(msgId);
  },

  render: function () {
    var that = this;
    var messageNodes = this.props.data.map(function (message) {
      return React.createElement(
        MessageItem,
        { msgId: message.id,
          msgSender: message.sender,
          msgTime: message.timestamp,
          onMsgHasRead: that.handleMsgHasRead,
          key: message.id },
        message.content
      );
    });
    return React.createElement(
      'div',
      { className: 'msgList' },
      React.createElement(
        ReactCSSTransitionGroup,
        {
          transitionName: {
            enter: 'msgItemEnter',
            enterActive: 'msgItemEnterActive',
            leave: 'msgItemLeave',
            leaveActive: 'msgItemLeaveActive' },
          transitionEnterTimeout: 300,
          transitionLeaveTimeout: 300 },
        messageNodes
      )
    );
  }
});

var MessageBox = React.createClass({
  displayName: 'MessageBox',

  getInitialState: function () {
    return { data: [] };
  },

  handleMsgHasRead: function (msgId) {
    var i, len, bakData, newData;

    bakData = this.state.data;
    newData = this.state.data.concat([]); // make a new copy
    for (i = 0, len = newData.length; i < len; i++) {
      if (newData[i].id == msgId) {
        newData.splice(i, 1);
        break;
      }
    }
    this.setState({ data: newData }); // preset state to make it feel faster

    // send data back to the server
    var that = this;
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: msgId,
      success: function (data) {
        that.setState({ data: data });
      },
      error: function (xhr, status, err) {
        that.setState({ data: bakData });
        console.error(that.props.url, status, err.toString());
      }
    });
  },

  loadMessagesFromServer: function () {
    var that = this;
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function (data) {
        that.setState({ data: data });
      },
      error: function (xhr, status, err) {
        console.error(that.props.url, status, err.toString());
      }
    });
  },

  componentDidMount: function () {
    this.loadMessagesFromServer();
    if (this.props.pollInterval) {
      // timely poll enabled
      setInterval(this.loadMessagesFromServer, this.props.pollInterval);
    }
  },

  render: function () {
    return React.createElement(
      'div',
      { className: 'msgBox' },
      React.createElement(MessageList, { data: this.state.data,
        onMsgHasRead: this.handleMsgHasRead })
    );
  }
});

ReactDOM.render(React.createElement(MessageBox, { url: '/test/data.json', pollInterval: 0 }), document.getElementById('container'));