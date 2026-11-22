import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TagField } from '../src/components/TagField/TagField'

const OPTIONS = ['Survival', 'Dawn', 'Kit']

function renderTags(value: string[] = [], options = OPTIONS) {
  const onChange = vi.fn()
  render(
    <TagField
      options={options}
      value={value}
      onChange={onChange}
    />,
  )
  return { onChange, user: userEvent.setup() }
}

describe('TagField', () => {
  it('lists the global catalogue and checks the tags the task already has', () => {
    renderTags(['Dawn'])

    expect(screen.getByRole('group', { name: 'Tags' })).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'Dawn' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Kit' })).not.toBeChecked()
  })

  it('adds a tag by checking it and removes it by unchecking', async () => {
    const { onChange, user } = renderTags(['Dawn'])

    await user.click(screen.getByRole('checkbox', { name: 'Kit' }))
    expect(onChange).toHaveBeenLastCalledWith(['Dawn', 'Kit'])

    await user.click(screen.getByRole('checkbox', { name: 'Dawn' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('creates a normalised tag from the input, with Enter', async () => {
    const { onChange, user } = renderTags()

    await user.type(screen.getByRole('textbox', { name: 'New tag' }), '  night   watch ')
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(['night watch'])
    expect(screen.getByRole('textbox', { name: 'New tag' })).toHaveValue('')
  })

  it('selects an existing tag instead of creating a duplicate', async () => {
    const { onChange, user } = renderTags()

    await user.type(screen.getByRole('textbox', { name: 'New tag' }), 'KIT')
    await user.click(screen.getByRole('button', { name: 'Add tag' }))

    expect(onChange).toHaveBeenCalledWith(['Kit'])
    expect(screen.queryByRole('checkbox', { name: 'KIT' })).not.toBeInTheDocument()
  })

  it('refuses an empty tag and a tag over the length limit', async () => {
    const { onChange, user } = renderTags()

    await user.click(screen.getByRole('button', { name: 'Add tag' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Write a tag first.')

    /* maxLength on the input stops the browser before the error can fire. */
    expect(screen.getByRole('textbox', { name: 'New tag' })).toHaveAttribute(
      'maxlength',
      '24',
    )
    expect(onChange).not.toHaveBeenCalled()
  })

  it('stops at six tags and disables the unchecked ones', async () => {
    const { onChange, user } = renderTags([
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
    ])

    expect(screen.getByRole('checkbox', { name: 'Kit' })).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: 'New tag' }), 'seven')
    await user.click(screen.getByRole('button', { name: 'Add tag' }))

    expect(screen.getByRole('alert')).toHaveTextContent('6 tags at most.')
    expect(onChange).not.toHaveBeenCalled()
  })
})
