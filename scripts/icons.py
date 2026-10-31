"""Shared vector arrow; avoids platform-specific emoji rendering."""
DIRECTIONS = {'↗':'up-right','↘':'down-right','↓':'down','←':'left','→':'right'}

def arrow_svg(character):
    direction = DIRECTIONS[character]
    return f'<svg class="arrow-icon arrow-icon--{direction}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-7-7 7 7-7 7"></path></svg>'
