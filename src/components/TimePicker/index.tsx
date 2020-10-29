import * as React from 'react';
import * as PropTypes from 'prop-types';
import RCTimePicker from 'rc-time-picker';
import { Glyphicon } from 'react-bootstrap';
import { TimePickerProps } from '../../interface';
import range from 'lodash/range';

import moment from 'moment';
import 'rc-time-picker/assets/index.css';
import './style.scss';

function remove59() {
  return range(59);
}

function remove0() {
  return range(1, 60);
}

const TimePicker: React.FC<TimePickerProps> = props => {
  const { hourStart, allowEmpty, hourEnd, placeholder, onChange, ...rest } = props;
  const [value, setValue] = React.useState(props.value || props.defaultValue);
  // 使用时才调用
  const handleChange = React.useCallback(
    (val: moment.Moment): void => {
      setValue(val);
      if (onChange) {
        onChange(val);
      }
    },
    [setValue, onChange],
  );
  let restProps = {};
  let currentValue = value;
  if (hourStart) {
    restProps = {
      showSecond: false,
      disabledMinutes: remove0,
      hideDisabledOptions: true,
    };
    currentValue = value && value.minute(0);
  } else if (hourEnd) {
    restProps = {
      showSecond: false,
      disabledMinutes: remove59,
      hideDisabledOptions: true,
    };
    currentValue = value && value.minute(59);
    currentValue = value && value.minute(59);
  }
  return (
    <RCTimePicker
      allowEmpty={allowEmpty}
      inputIcon={allowEmpty && value ? undefined : <Glyphicon glyph="time" />}
      {...rest}
      {...restProps}
      placeholder={placeholder}
      value={currentValue}
      onChange={handleChange}
    />
  );
};

TimePicker.propTypes = {
  /** 分钟固定为 0 的小时选择 */
  hourStart: PropTypes.bool,
  /** 分钟固定为 59 的小时选择 */
  hourEnd: PropTypes.bool,
  /** 默认展示文本 */
  placeholder: PropTypes.string,
  /**
   * 改变时间会触发 onChange 执行
   */
  onChange: PropTypes.func,
  /** 是否允许为空 */
  allowEmpty: PropTypes.bool,
};

TimePicker.defaultProps = {
  placeholder: '请选择时间',
  allowEmpty: true,
};

export default TimePicker;
