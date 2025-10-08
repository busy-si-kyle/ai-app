
import React, { useState, useCallback, useMemo } from 'react';
import { editImageWithGemini } from './services/geminiService';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const Header = () => (
    <header className="bg-slate-900/50 backdrop-blur-sm p-4 border-b border-slate-700 w-full sticky top-0 z-10">
        <div className="container mx-auto flex justify-center items-center">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                AI Photo Editor
            </h1>
        </div>
    </header>
);

const Loader = ({ message }: { message: string }) => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-center items-center z-50">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
        <p className="text-slate-300 mt-4 text-lg">{message}</p>
    </div>
);

const App: React.FC = () => {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [editedImageBase64, setEditedImageBase64] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const originalImagePreview = useMemo(() => {
        if (!originalFile) return null;
        return URL.createObjectURL(originalFile);
    }, [originalFile]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file (PNG, JPG, etc.).');
                return;
            }
            setOriginalFile(file);
            setEditedImageBase64(null);
            setPrompt('');
            setError(null);
        }
    };

    const handleReset = useCallback(() => {
        setOriginalFile(null);
        setEditedImageBase64(null);
        setPrompt('');
        setError(null);
        setIsLoading(false);
        // Clean up object URL
        if (originalImagePreview) {
            URL.revokeObjectURL(originalImagePreview);
        }
    }, [originalImagePreview]);

    const handleSubmitEdit = async () => {
        if (!originalFile || !prompt.trim()) {
            setError('Please provide an image and a descriptive prompt.');
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Applying AI magic...');
        setError(null);
        setEditedImageBase64(null);

        try {
            const resultBase64 = await editImageWithGemini(originalFile, prompt);
            setEditedImageBase64(resultBase64);
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleDownload = () => {
        if (!editedImageBase64) return;
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${editedImageBase64}`;
        link.download = `edited-${originalFile?.name || 'image'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans">
            {isLoading && <Loader message={loadingMessage} />}
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                {!originalFile ? (
                    <div className="max-w-2xl mx-auto">
                        <label
                            htmlFor="file-upload"
                            className="relative block w-full h-64 border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-indigo-500 cursor-pointer transition-colors duration-300"
                        >
                            <div className="flex flex-col items-center justify-center h-full">
                                <CameraIcon />
                                <span className="mt-2 block text-sm font-medium text-slate-400">
                                    Click to upload or drag and drop
                                </span>
                                <span className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</span>
                            </div>
                            <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                        </label>
                         {error && <p className="mt-4 text-center text-red-400">{error}</p>}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {error && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-center" role="alert">
                                <p>{error}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col items-center">
                                <h2 className="text-lg font-semibold text-slate-300 mb-2">Original</h2>
                                <img src={originalImagePreview || ''} alt="Original" className="rounded-lg shadow-lg object-contain max-h-[50vh] w-full" />
                            </div>
                            <div className="flex flex-col items-center">
                                <h2 className="text-lg font-semibold text-slate-300 mb-2">Edited</h2>
                                <div className="w-full h-full min-h-[200px] bg-slate-800 rounded-lg shadow-lg flex items-center justify-center">
                                    {editedImageBase64 ? (
                                        <img src={`data:image/png;base64,${editedImageBase64}`} alt="Edited" className="rounded-lg object-contain max-h-[50vh] w-full" />
                                    ) : (
                                        <p className="text-slate-500">Your edited image will appear here</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 shadow-xl">
                             <label htmlFor="prompt" className="block text-md font-medium text-slate-300 mb-2">
                                Editing Prompt
                            </label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., 'Add a wizard hat to the person', 'Change background to a futuristic city at night'"
                                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none text-slate-200 placeholder-slate-500"
                                rows={3}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={handleSubmitEdit}
                                disabled={isLoading || !prompt.trim()}
                                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                Generate
                            </button>
                            {editedImageBase64 && (
                                <button
                                    onClick={handleDownload}
                                    className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    Download
                                </button>
                            )}
                            <button
                                onClick={handleReset}
                                className="px-8 py-3 bg-slate-700 text-slate-300 font-bold rounded-full hover:bg-slate-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
