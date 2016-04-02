var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var MessageItem = React.createClass({
  handleMsgHasRead: function(e) {
    this.props.onMsgHasRead(this.props.msgId);
  },

  render: function() {
    var time = new Date(+this.props.msgTime);
    var year = time.getFullYear();
    var month = formatDigit(time.getMonth() + 1);
    var date = formatDigit(time.getDate());
    var hour = formatDigit(time.getHours());
    var minute = formatDigit(time.getMinutes());
    time = '' + year + '-' + month + '-' + date + 
           ' ' + hour + ':' + minute;

    function formatDigit(d) {
      return ((d < 10 ? '0' : '') + d);
    }

    return (
      <div className="msgItem">
        <div className="msgItemHeader">
          <span className="msgSender">
            {this.props.msgSender}
          </span>
          <span className="msgTime">
            {time}
          </span>
        </div>
        <div className="msgItemInner">
          <div className="msgContent">
            {this.props.children}
          </div>
          <a href="#" className="hasReadBtn" 
                  onClick={this.handleMsgHasRead}>
            标为已读
          </a>
        </div>
      </div>
    );
  }
});


var MessageList = React.createClass({
  handleMsgHasRead: function(msgId) {
    this.props.onMsgHasRead(msgId);
  },

  render: function() {
    var that = this;
    var messageNodes = this.props.data.map(function(message) {
      return (
        <MessageItem msgId={message.id} 
                     msgSender={message.sender} 
                     msgTime={message.timestamp}
                     onMsgHasRead={that.handleMsgHasRead} 
                     key={message.id}>
          {message.content}
        </MessageItem>
      );
    });
    return (
      <div className="msgList">
        <ReactCSSTransitionGroup 
          transitionName={{
            enter: 'msgItemEnter',
            enterActive: 'msgItemEnterActive',
            leave: 'msgItemLeave',
            leaveActive: 'msgItemLeaveActive',}} 
          transitionEnterTimeout={300} 
          transitionLeaveTimeout={300}>
          {messageNodes}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
});


var MessageBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },

  handleMsgHasRead: function(msgId) {
    var i, len, bakData, newData;

    bakData = this.state.data;
    newData = this.state.data.concat([]); // make a new copy
    for (i = 0, len = newData.length; i < len; i++) {
      if (newData[i].id == msgId) {
        newData.splice(i, 1);
        break;
      }
    }
    this.setState({data: newData}); // preset state to make it feel faster

    // send data back to the server
    var that = this;
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: msgId,
      success: function(data) {
        that.setState({data: data});
      },
      error: function(xhr, status, err) {
        that.setState({data: bakData});
        console.error(that.props.url, status, err.toString());
      }
    });
  },

  loadMessagesFromServer: function() {
    var that = this;
    $.ajax({
      url: this.props.url, 
      dataType: 'json',
      cache: false,
      success: function(data) {
        that.setState({data: data});
      },
      error: function(xhr, status, err) {
        console.error(that.props.url, status, err.toString());
      }
    });
  },

  componentDidMount: function() {
    this.loadMessagesFromServer();
    if (this.props.pollInterval) {  // timely poll enabled
      setInterval(this.loadMessagesFromServer, this.props.pollInterval);
    }
  },

  render: function() {
    return (
      <div className="msgBox">
        <MessageList data={this.state.data} 
                     onMsgHasRead={this.handleMsgHasRead} />
      </div>
    );
  }
});


ReactDOM.render(
  <MessageBox url="/test/data.json" pollInterval={0} />,
  document.getElementById('container')
);