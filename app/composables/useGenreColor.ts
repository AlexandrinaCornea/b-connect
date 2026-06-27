const genreColors: Record<string, string> = {
  'Roman': 'bg-purple-100 text-purple-700',
  'SF': 'bg-blue-100 text-blue-700',
  'Fantasy': 'bg-indigo-100 text-indigo-700',
  'Thriller': 'bg-red-100 text-red-700',
  'Mister': 'bg-orange-100 text-orange-700',
  'Biografie': 'bg-yellow-100 text-yellow-700',
  'Istorie': 'bg-amber-100 text-amber-700',
  'Știință': 'bg-cyan-100 text-cyan-700',
  'Dezvoltare personală': 'bg-green-100 text-green-700',
  'Poezie': 'bg-pink-100 text-pink-700',
  'Altele': 'bg-gray-100 text-gray-600',
}

export function useGenreColor() {
  function genreClass(genre: string) {
    return genreColors[genre] ?? 'bg-gray-100 text-gray-600'
  }
  return { genreClass }
}
