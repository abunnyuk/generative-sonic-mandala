buildscript {
    // Patched versions of transitive build-tool (AGP) dependencies flagged by Snyk.
    dependencies {
        constraints {
            classpath("io.netty:netty-codec-http2:4.1.140.Final") { because("Snyk: multiple netty CVEs") }
            classpath("io.netty:netty-codec-http:4.1.140.Final")
            classpath("io.netty:netty-codec-socks:4.1.140.Final")
            classpath("io.netty:netty-codec:4.1.140.Final")
            classpath("io.netty:netty-handler:4.1.140.Final")
            classpath("io.netty:netty-handler-proxy:4.1.140.Final")
            classpath("io.netty:netty-common:4.1.140.Final")
            classpath("io.netty:netty-transport-native-unix-common:4.1.140.Final")
            classpath("com.google.protobuf:protobuf-java:3.25.9") { because("Snyk: SNYK-JAVA-COMGOOGLEPROTOBUF-8055227") }
            classpath("commons-io:commons-io:2.22.0") { because("Snyk: SNYK-JAVA-COMMONSIO-8161190") }
        }
    }
}

plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "2.1.0" apply false
}
allprojects {
    configurations.all {
        resolutionStrategy {
            force("com.google.guava:guava:33.7.2-android")
            // AGP's internal tool configurations (unified test platform, lint, etc.) resolve
            // old transitive versions flagged by Snyk. Override them project-wide.
            eachDependency {
                when {
                    requested.group == "io.netty" && requested.version?.startsWith("4.1.") == true ->
                        useVersion("4.1.140.Final")
                    requested.group == "com.google.protobuf" && requested.name == "protobuf-java" &&
                        requested.version?.startsWith("3.") == true ->
                        useVersion("3.25.9")
                    requested.group == "commons-io" && requested.name == "commons-io" ->
                        useVersion("2.22.0")
                    requested.group == "org.jetbrains.kotlin" && requested.name == "kotlin-stdlib" &&
                        requested.version?.startsWith("1.") == true ->
                        useVersion("2.1.0")
                }
            }
        }
    }
}