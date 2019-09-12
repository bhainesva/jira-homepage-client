import React from 'react';
import './JiraItem.css';

export const JiraItem = (props) => {
  return (
    <button onClick={props.onClick} className="JiraItem">
      <div className="JiraItem-summary">{props.summary}</div>
      <a className="JiraItem-key" href={`https://yexttest.atlassian.net/browse/${props.jiraKey}`}>{props.jiraKey}</a>
    </button>
  );
}

