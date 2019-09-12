import io from 'socket.io-client';
import React, { Component } from 'react';
import * as R from 'ramda';
import { JiraItem } from './JiraItem.js';
import './App.css';
import './loading.css';
import './loading-btn.css';

class App extends Component {
  state = {
    socket: null,
    localItems: [],
    stagingItems: [],
    workbench: [],
    currentlyBuilding: false,
    buildUrl: '',
  }

  componentDidMount() {
    this.getDataFromDb();

    this.socket = io(`http://localhost:8090`);

    this.socket.on('buildFinished', (url) => {
      this.setState({
        ...this.state,
        currentlyBuilding: false,
        buildUrl: url
      });
    });
  }

  getDataFromDb = () => {
    fetch('http://localhost:3001/api/localBranchItems')
    .then((data) => data.json())
    .then((res) => this.setState({localItems: res.items}));

    fetch('http://localhost:3001/api/stagingItems')
    .then((data) => data.json())
    .then((res) => this.setState({stagingItems: res.items}));
  }

  buildBranchHandler() {
    fetch('http://localhost:3001/api/integrateItems', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({items: this.state.workbench.map(R.prop('key'))}), // body data type must match "Content-Type" header
    });
    this.setState({
      ...this.state,
      currentlyBuilding: true
    });
  };

  itemClickHandler(item) {
    let workbench = this.state.workbench;

    if (this.state.workbench.map(i => i.key).includes(item.key)) {
      workbench = this.state.workbench.filter(i => i.key!==item.key);
    } else {
      workbench = [...this.state.workbench, item]
    }
    this.setState({
      ...this.state,
      workbench
    });
  }

  addAllToWorkbench(items) {
    const newItems = [];
    const currentWorkbenchKeys = this.state.workbench.map(item => item.key);

    for (const item of items) {
      if (!currentWorkbenchKeys.includes(item.key)) {
        newItems.push(item)
      }
    }

    this.setState({
      ...this.state,
      workbench: [...this.state.workbench, ...newItems]
    });
  }

  clearWorkbench() {
    this.setState({
      ...this.state,
      workbench: []
    });
  }

  render() {
    return (
      <div className="App">
        <div className="ItemColumn">
          <div className="ItemColumn-heading">
            Trunk Branches
            <button className="ItemColumn-headingButton" onClick={() => this.addAllToWorkbench(this.state.localItems)}>+ All to workbench</button>
          </div>
          {this.state.localItems.map(item => <JiraItem onClick={() => this.itemClickHandler(item)} jiraKey={item.key} summary={item.fields.summary} />)}
        </div>
        <div className="ItemColumn">
          <div className="ItemColumn-heading">
            Items on Staging
            <button className="ItemColumn-headingButton" onClick={() => this.addAllToWorkbench(this.state.stagingItems)}>+ All to workbench</button>
          </div>
          {this.state.stagingItems.map(item => <JiraItem onClick={() => this.itemClickHandler(item)} jiraKey={item.key} summary={item.fields.summary} />)}
        </div>
        <div className="ItemColumn">
          <div className="ItemColumn-heading">
            Workbench
            <button className="ItemColumn-headingButton" onClick={() => this.clearWorkbench()}>Clear</button>
          </div>
          {this.state.workbench.map(item => <JiraItem onClick={() => this.itemClickHandler(item)} jiraKey={item.key} summary={item.fields.summary} />)}
          <button className={`Button--build ld-ext-right${this.state.currentlyBuilding ? ' running' : ''}`}
                  onClick={this.buildBranchHandler.bind(this)}
                  disabled={this.state.currentlyBuilding || this.state.workbench.length == 0}>
            Build & Publish
            <div className="ld ld-ring ld-spin"></div>
          </button>
          <div className="App-status">
            <span className="App-statusLabel">
              Previous Build Location:
            </span>
            {this.state.buildUrl ?
            <a href={this.state.buildUrl}>publish log</a>
            : ''}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
