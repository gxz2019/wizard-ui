import React from 'react';
import { storiesOf } from '@storybook/react';
import { NotificationList } from '../src';
import { Button } from 'react-bootstrap';
import { Map as MapType, NotificationItem, NotificationItemStatus } from '../src/interface';

const STATUS = ['success', 'info', 'process', 'warning', 'danger'];

const NotificationListDefault = (props: { showTitle?: boolean; autoClose?: boolean }) => {
  const [lists, setLists] = React.useState(() => {
    const dns = new Map() as MapType<string, any>;
    const sns = new Map() as MapType<string, any>;
    STATUS.forEach((s: string) => {
      const item: NotificationItem = { id: s, status: s as NotificationItemStatus, text: `${s} text message !` };
      if (props.showTitle) {
        item.title = <h3>{s} title</h3>;
      }
      sns.set(s, item);
    });
    dns.set('status', sns);
    return dns;
  });
  const setNotification = (s: NotificationItemStatus) => {
    const item: NotificationItem = { id: s, status: s, text: `${s} text message !` };
    if (props.showTitle) {
      item.title = <h3>{s} title</h3>;
    }
    lists.get('status').set(s, item);
    const newLists = new Map(lists);
    setLists(newLists);
  }
  const deleteNotification = (id: NotificationItemStatus) => {
    lists.get('status').delete(id);
    const newLists = new Map(lists);
    setLists(newLists);
  }
  return (
    <div>
      {props.autoClose && <div>默认 2s 自动关闭</div>}
      <div>
        {STATUS.map((s: string) => (
          <Button
            key={s}
            style={{ marginRight: '10px' }}
            onClick={() => setNotification(s as NotificationItemStatus)}
            disabled={lists.get('status').has(s)}
          >
            {s}
          </Button>
        ))}
      </div>
      <NotificationList
        notifications={lists}
        onDismiss={deleteNotification}
        autoClose={props.autoClose}
      />
    </div>
  )
}



storiesOf('DATA SHOW | NotificationList', module)
  .add('default', () => <NotificationListDefault />)
  .add('with title', () => <NotificationListDefault showTitle/>)
  .add('auto close', () => <NotificationListDefault autoClose/>)