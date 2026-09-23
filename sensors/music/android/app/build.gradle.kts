plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "digital.thaiduy.hub"
    compileSdk = 35

    defaultConfig {
        applicationId = "digital.thaiduy.hub"
        minSdk = 29
        targetSdk = 35
        versionCode = 9
        versionName = "0.4.4"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
}
