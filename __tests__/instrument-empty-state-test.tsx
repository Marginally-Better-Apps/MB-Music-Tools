import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { InstrumentEmptyState } from '@/components/instrument-empty-state';

describe('<InstrumentEmptyState />', () => {
  test('fills the canvas with a centered system large title, not a phone column', async () => {
    const { getByText, toJSON } = await render(
      <InstrumentEmptyState title="Tuner" supporting="Play a note when you are ready." />
    );

    const tree = toJSON();
    expect(tree).toBeTruthy();
    if (!tree || Array.isArray(tree)) {
      throw new Error('Expected a single canvas root');
    }

    const canvas = StyleSheet.flatten(tree.props.style);
    expect(canvas).toEqual(expect.objectContaining({ flex: 1 }));
    expect(canvas.maxWidth).toBeUndefined();

    const titleStyle = StyleSheet.flatten(getByText('Tuner').props.style);
    expect(titleStyle.fontSize).toBeGreaterThanOrEqual(34);
    expect(titleStyle.textAlign).toBe('center');

    const supportingStyle = StyleSheet.flatten(
      getByText('Play a note when you are ready.').props.style
    );
    expect(supportingStyle.textAlign).toBe('center');
  });
});
