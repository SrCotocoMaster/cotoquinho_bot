import { registerRootComponent } from 'expo';
import { Provider } from '@cotoquinho/app/provider';
import { HomeScreen } from '@cotoquinho/app/features/home/screen';

function App() {
    return (
        <Provider>
        <HomeScreen />
        </Provider>
    );
}

registerRootComponent(App);
